import { useState, useCallback, useEffect } from "react";

// ============================================================
// DONNÉES INITIALES
// ============================================================
const INITIAL_DATA = {
  profile: {
    name: "Sami",
    bio: "Passionné de parcs d'attractions depuis toujours. Je partage ici mes conseils, mes coups de cœur et mes découvertes pour vous aider à profiter au maximum de chaque visite.",
    photo: null,
  },
  parks: [
    {
      id: "disneyland-paris",
      name: "Disneyland Paris",
      emoji: "🏰",
      country: "France",
      coverColor: "#1a1a6e",
      accentColor: "#e8c547",
      visited: "2023",
      globalTip: "Arrivez 30 min avant l'ouverture. Les premières heures sont magiques.",
      heroImage: null,
      access: { transport: "", parking: "", address: "", hours: "" },
      tickets: { adult: "", child: "", annualPass: "", tips: "" },
      attractions: [
        {
          id: "space-mountain", name: "Space Mountain", type: "Montagne russe",
          thrill: 5, minHeight: 120, fastpass: true, singleRider: false,
          duration: "3 min", waitAvg: "60 min",
          tip: "La meilleure attraction du parc. Prenez le FastPass dès l'ouverture.",
          bio: null, photos: [], tags: ["Sensations fortes", "Must-do", "Dans le noir"],
          status: "open",
        },
        {
          id: "pirates-des-caraibes", name: "Pirates des Caraïbes", type: "Bateau",
          thrill: 2, minHeight: null, fastpass: false, singleRider: false,
          duration: "15 min", waitAvg: "25 min",
          tip: "Idéal en milieu de journée quand les files sont longues ailleurs.",
          bio: null, photos: [], tags: ["Famille", "Emblématique", "Intérieur"],
          status: "open",
        },
      ],
      restaurants: [],
      shop: {
        categories: [
          { id: "vetements-homme", name: "Vêtements Homme", emoji: "👔" },
          { id: "vetements-femme", name: "Vêtements Femme", emoji: "👗" },
          { id: "vetements-enfant", name: "Vêtements Enfant", emoji: "🧒" },
          { id: "mugs", name: "Mugs & Tasses", emoji: "☕" },
          { id: "peluches", name: "Peluches", emoji: "🧸" },
          { id: "accessoires", name: "Accessoires", emoji: "👜" },
          { id: "soldes", name: "🔴 Soldes en cours", emoji: "🏷️" },
        ],
        products: [
          {
            id: "sweat-mickey-gris", name: "Sweat Mickey Classique",
            categoryId: "vetements-homme",
            description: "Sweat molletonné avec broderie Mickey Mouse sur la poitrine.",
            price: 59.99, photos: [],
            sizes: { adulte: ["XS","S","M","L","XL","XXL"], enfant: [] },
            availableSizes: ["XS","S","M","L","XL"],
            discountEligible: true, noDiscount: false,
            boutiques: "World of Disney, Disney Fashion",
            isExclusivity: false, topSale: true, heartPick: false,
            arrivalDate: "", limitedQty: false, limitedNote: "",
            tags: ["Mickey", "Sweat"],
          },
        ],
      },
    },
  ],
};

const SIZES_ADULTE = ["XS","S","M","L","XL","XXL"];
const SIZES_ENFANT = ["2 ans","4 ans","6 ans","8 ans","10 ans","12 ans","14 ans"];
const DISCOUNTS = [
  { key: "cm", label: "CM (Cast Member)", pct: 25, color: "#7c3aed" },
  { key: "gold", label: "Pass Annuel Gold", pct: 15, color: "#d97706" },
  { key: "silver", label: "Pass Annuel Silver", pct: 10, color: "#64748b" },
];

function discountedPrice(price, pct) {
  return (price * (1 - pct / 100)).toFixed(2);
}

// ============================================================
// CLOUDINARY CONFIG
// ============================================================
const CLOUDINARY_CLOUD_NAME = "dgllplwhr";
const CLOUDINARY_UPLOAD_PRESET = "park-blog";
const CLOUDINARY_DELETE_WORKER = "https://sami-parks-cloudinary-delete.sammy-avcuoglu.workers.dev";

async function deleteFromCloudinary(public_id) {
  if (!public_id) return;
  try {
    await fetch(CLOUDINARY_DELETE_WORKER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id }),
    });
  } catch (e) {
    console.error("Erreur suppression Cloudinary:", e);
  }
}

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!data.secure_url) throw new Error("Upload échoué");
  return { url: data.secure_url, caption: file.name, public_id: data.public_id };
}

// ============================================================
// CSS GLOBAL
// ============================================================
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Nunito:wght@400;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f5f0e8; color: #0d1b4b; font-family: 'Nunito', sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #e8e0cc; }
  ::-webkit-scrollbar-thumb { background: #0d1b4b; border-radius: 3px; }

  .park-card { transition: transform 0.25s, box-shadow 0.25s; cursor: pointer; }
  .park-card:hover { transform: translateY(-6px); box-shadow: 0 12px 32px rgba(13,27,75,0.18); }

  .attr-card { transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
  .attr-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(13,27,75,0.15); }

  .btn-primary {
    background: #e8c547; color: #0d1b4b; border: none;
    padding: 10px 22px; border-radius: 30px; font-family: 'Nunito', sans-serif;
    font-weight: 800; font-size: 14px; cursor: pointer; transition: all 0.2s;
    letter-spacing: 0.5px;
  }
  .btn-primary:hover { background: #f5d84a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(232,197,71,0.4); }

  .btn-secondary {
    background: #0d1b4b; color: #e8c547; border: none;
    padding: 10px 22px; border-radius: 30px; font-family: 'Nunito', sans-serif;
    font-weight: 800; font-size: 14px; cursor: pointer; transition: all 0.2s;
  }
  .btn-secondary:hover { background: #162266; transform: translateY(-1px); }

  .nav-link { transition: color 0.2s; }
  .nav-link:hover { color: #e8c547 !important; }

  .tab-btn { transition: all 0.2s; cursor: pointer; }
  .tab-btn:hover { background: rgba(232,197,71,0.1); }

  .product-card { transition: transform 0.25s, box-shadow 0.25s; cursor: pointer; }
  .product-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(13,27,75,0.15); }

  .hero-bg {
    background: #0d1b4b;
    position: relative;
    overflow: hidden;
  }
  .hero-bg::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 70% 50%, rgba(232,197,71,0.12) 0%, transparent 60%),
                radial-gradient(ellipse at 20% 80%, rgba(232,197,71,0.07) 0%, transparent 50%);
  }
  .stripe-accent {
    background: repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 10px,
      rgba(232,197,71,0.08) 10px,
      rgba(232,197,71,0.08) 20px
    );
  }

  .input-field {
    width: 100%; background: #fff; border: 2px solid #e0d8c8;
    border-radius: 10px; padding: 10px 14px; color: #0d1b4b;
    font-size: 14px; font-family: 'Nunito', sans-serif; outline: none;
    transition: border-color 0.2s;
  }
  .input-field:focus { border-color: #0d1b4b; }

  .section-label {
    font-size: 11px; color: #7a8aaa; letter-spacing: 3px;
    text-transform: uppercase; margin-bottom: 6px; display: block;
    font-weight: 700;
  }
  .badge {
    font-size: 10px; font-weight: 800; padding: 3px 10px;
    border-radius: 20px; letter-spacing: 0.5px;
  }
  .star { font-size: 15px; }
  .thrill-star-on { color: #e8c547; }
  .thrill-star-off { color: #d0c8b0; }
`;

// ============================================================
// COMPOSANTS UTILITAIRES
// ============================================================
function ThrillStars({ level }) {
  return (
    <span>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`star ${i < level ? "thrill-star-on" : "thrill-star-off"}`}>★</span>
      ))}
    </span>
  );
}

function AdminInput({ label, value, onChange, type = "text", placeholder, rows }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <span className="section-label">{label}</span>}
      {rows
        ? <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input-field" style={{ resize: "vertical" }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input-field" />
      }
    </div>
  );
}

// ============================================================
// AI BIO GENERATOR
// ============================================================
function AIBioGenerator({ attraction, parkName, onBioGenerated }) {
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: `Tu es un expert des parcs d'attractions. Rédige une fiche captivante pour "${attraction.name}" du parc "${parkName}". Type: ${attraction.type}, Durée: ${attraction.duration}, Sensations: ${attraction.thrill}/5, Tags: ${attraction.tags.join(", ")}, Conseil: ${attraction.tip}. Réponds en JSON brut: {"intro":"...","experience":"...","bestFor":"...","funFact":"..."}` }],
        }),
      });
      const data = await res.json();
      const text = data.content.map(b => b.text || "").join("");
      onBioGenerated(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch {
      onBioGenerated({ intro: "Une attraction incontournable.", experience: "Des sensations uniques.", bestFor: "Toute la famille.", funFact: "Des millions de visiteurs chaque année." });
    }
    setLoading(false);
  };
  return (
    <button onClick={generate} disabled={loading} className="btn-primary" style={{ opacity: loading ? 0.7 : 1 }}>
      {loading ? "⚡ Génération en cours..." : "✨ Générer la bio avec l'IA"}
    </button>
  );
}

// ============================================================
// NAVIGATION
// ============================================================
function Nav({ mode, setMode, setView, selectedPark, setSelectedPark, setSelectedAttraction, setParkTab, setAdminParkView, data, adminUnlocked }) {
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "#0d1b4b", borderBottom: "3px solid #e8c547", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div
          onClick={() => { setView(mode === "admin" ? "admin-home" : "home"); setSelectedPark(null); setSelectedAttraction(null); }}
          style={{ fontFamily: "'Bangers', cursive", fontSize: 26, color: "#e8c547", cursor: "pointer", letterSpacing: 2, lineHeight: 1 }}
        >
          SAMI<span style={{ color: "#fff" }}>PARKS</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {data.parks.map(p => (
            <button
              key={p.id}
              className="nav-link"
              onClick={() => { setSelectedPark(p.id); setSelectedAttraction(null); setParkTab("attractions"); setAdminParkView("attractions"); setView(mode === "admin" ? "admin-park" : "park"); }}
              style={{ background: selectedPark === p.id ? "#e8c547" : "transparent", color: selectedPark === p.id ? "#0d1b4b" : "#aab4cc", border: "none", padding: "5px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, transition: "all 0.2s" }}
            >
              {p.emoji} {p.name}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={() => { setMode(mode === "admin" ? "visitor" : "admin"); setView(mode === "admin" ? "home" : "admin-home"); }}
        style={{ background: mode === "admin" ? "#e8c547" : "transparent", color: mode === "admin" ? "#0d1b4b" : "#aab4cc", border: "1px solid", borderColor: mode === "admin" ? "#e8c547" : "#2a3a6b", padding: "5px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700 }}
      >
        {mode === "admin" ? "⚡ Admin" : "Admin"}
      </button>
    </nav>
  );
}

// ============================================================
// HOME PAGE
// ============================================================
function HomePage({ data, setSelectedPark, setParkTab, setView }) {
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* HERO */}
      <div className="hero-bg" style={{ padding: "80px 24px 60px", position: "relative" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: data.profile.photo ? "1fr 1fr" : "1fr", gap: 48, alignItems: "center", position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ display: "inline-block", background: "#e8c547", color: "#0d1b4b", fontWeight: 800, fontSize: 11, letterSpacing: 3, padding: "4px 14px", borderRadius: 20, marginBottom: 20 }}>
              BLOG PARCS D'ATTRACTIONS
            </div>
            <h1 style={{ fontFamily: "'Bangers', cursive", fontSize: "clamp(52px, 8vw, 90px)", color: "#fff", lineHeight: 0.95, letterSpacing: 2, marginBottom: 24 }}>
              BIENVENUE<br />SUR MON<br /><span style={{ color: "#e8c547" }}>BLOG !</span>
            </h1>
            <p style={{ color: "#aab4cc", fontSize: 16, lineHeight: 1.7, maxWidth: 480, marginBottom: 32, fontWeight: 600 }}>
              {data.profile.bio}
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn-primary" onClick={() => { setSelectedPark(data.parks[0]?.id); setParkTab("attractions"); setView("park"); }}>
                Découvrir les parcs →
              </button>
            </div>
          </div>
          {data.profile.photo && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 300, height: 300, borderRadius: "50%", overflow: "hidden", border: "4px solid #e8c547", boxShadow: "0 0 0 8px rgba(232,197,71,0.15)" }}>
                <img src={data.profile.photo} alt="Sami" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>
          )}
        </div>
        {/* Stripe décoratif */}
        <div className="stripe-accent" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 8 }} />
      </div>

      {/* PARCS VISITÉS */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 40 }}>
          <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: 48, color: "#0d1b4b", letterSpacing: 2 }}>
            PARCS VISITÉS
          </h2>
          <span style={{ color: "#7a8aaa", fontSize: 13, fontWeight: 700 }}>{data.parks.length} parc(s)</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          {data.parks.map(p => (
            <div
              key={p.id}
              className="park-card"
              onClick={() => { setSelectedPark(p.id); setParkTab("attractions"); setView("park"); }}
              style={{ background: "#fff", borderRadius: 20, overflow: "hidden", border: "2px solid #e8e0cc", boxShadow: "0 4px 16px rgba(13,27,75,0.07)" }}
            >
              {/* Bannière colorée */}
              <div style={{ height: 160, background: `linear-gradient(135deg, ${p.coverColor} 0%, ${p.coverColor}cc 100%)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                <div className="stripe-accent" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />
                {p.heroImage
                  ? <img src={p.heroImage} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                  : <span style={{ fontSize: 72, position: "relative", zIndex: 1 }}>{p.emoji}</span>
                }
                <div style={{ position: "absolute", bottom: 10, right: 14, fontSize: 11, color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: 2 }}>{p.visited}</div>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 11, color: "#e8a500", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6, fontWeight: 800 }}>{p.country}</div>
                <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 28, color: "#0d1b4b", letterSpacing: 1, marginBottom: 12 }}>{p.name}</h3>
                <div style={{ display: "flex", gap: 16 }}>
                  <span style={{ color: "#7a8aaa", fontSize: 13, fontWeight: 700 }}>🎢 {p.attractions.length} attraction(s)</span>
                  <span style={{ color: "#7a8aaa", fontSize: 13, fontWeight: 700 }}>🛍️ {p.shop?.products.length || 0} produit(s)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PARK PAGE
// ============================================================
function ParkPage({ park, parkTab, setParkTab, setSelectedAttraction, setView }) {
  const tabs = [
    ["attractions", "🎢 Attractions"],
    ["restaurants", "🍽️ Restaurants"],
    ["shop", "🛍️ Boutique"],
    ["conseils", "💡 Conseils & Accès"],
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8" }}>
      {/* HERO PARC */}
      <div style={{ background: park.coverColor, padding: "60px 24px 0", position: "relative", overflow: "hidden" }}>
        <div className="stripe-accent" style={{ position: "absolute", inset: 0, opacity: 0.3 }} />
        {park.heroImage && <img src={park.heroImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.2 }} />}
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1, paddingBottom: 40 }}>
          <div style={{ fontSize: 64, marginBottom: 8 }}>{park.emoji}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: 4, fontWeight: 700, textTransform: "uppercase" }}>{park.country} · {park.visited}</div>
          <h1 style={{ fontFamily: "'Bangers', cursive", fontSize: "clamp(40px,7vw,72px)", color: "#fff", letterSpacing: 3, marginTop: 8 }}>{park.name}</h1>
        </div>
        {/* ONGLETS */}
        <div style={{ display: "flex", justifyContent: "center", gap: 4, position: "relative", zIndex: 1, paddingBottom: 0 }}>
          {tabs.map(([tab, label]) => (
            <button
              key={tab}
              className="tab-btn"
              onClick={() => setParkTab(tab)}
              style={{ background: parkTab === tab ? "#e8c547" : "rgba(255,255,255,0.1)", color: parkTab === tab ? "#0d1b4b" : "rgba(255,255,255,0.7)", border: "none", padding: "12px 20px", borderRadius: "12px 12px 0 0", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: parkTab === tab ? 800 : 600 }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENU ONGLET */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        {parkTab === "attractions" && <AttractionsTab park={park} setSelectedAttraction={setSelectedAttraction} setView={setView} />}
        {parkTab === "restaurants" && <RestaurantsTab park={park} />}
        {parkTab === "shop" && <ShopTab park={park} />}
        {parkTab === "conseils" && <ConseilsTab park={park} />}
      </div>
    </div>
  );
}

// ============================================================
// ONGLET ATTRACTIONS
// ============================================================
function AttractionsTab({ park, setSelectedAttraction, setView }) {
  return (
    <div>
      {park.globalTip && (
        <div style={{ background: "#0d1b4b", borderRadius: 16, padding: "20px 24px", marginBottom: 40, display: "flex", gap: 16, alignItems: "flex-start" }}>
          <span style={{ fontSize: 24 }}>💡</span>
          <div>
            <div style={{ fontSize: 11, color: "#e8c547", letterSpacing: 3, fontWeight: 800, marginBottom: 6 }}>MON CONSEIL GLOBAL</div>
            <p style={{ color: "#e8e0d0", lineHeight: 1.7, fontWeight: 600 }}>{park.globalTip}</p>
          </div>
        </div>
      )}
      <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: 40, color: "#0d1b4b", letterSpacing: 2, marginBottom: 28 }}>
        ATTRACTIONS ({park.attractions.length})
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {park.attractions.map(attr => (
          <div
            key={attr.id}
            className="attr-card"
            onClick={() => { setSelectedAttraction(attr.id); setView("attraction"); }}
            style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "2px solid #e8e0cc" }}
          >
            {/* Photo ou placeholder */}
            <div style={{ height: 180, background: `linear-gradient(135deg, ${park.coverColor}22, ${park.coverColor}44)`, position: "relative", overflow: "hidden" }}>
              {attr.photos.length > 0
                ? <img src={attr.photos[0].url} alt={attr.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, color: park.coverColor, opacity: 0.4 }}>🎢</div>
              }
              {attr.status === "closed" && (
                <div style={{ position: "absolute", top: 10, left: 10, background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: 1 }}>FERMÉ</div>
              )}
              {attr.fastpass && (
                <div style={{ position: "absolute", top: 10, right: 10, background: "#e8c547", color: "#0d1b4b", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, letterSpacing: 1 }}>FASTPASS</div>
              )}
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 10, color: "#7a8aaa", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{attr.type}</div>
              <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 22, color: "#0d1b4b", letterSpacing: 1, marginBottom: 8 }}>{attr.name}</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <ThrillStars level={attr.thrill} />
                <span style={{ fontSize: 12, color: "#7a8aaa", fontWeight: 700 }}>{attr.waitAvg || "—"}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {attr.tags.slice(0, 2).map(t => (
                  <span key={t} style={{ fontSize: 10, color: "#0d1b4b", background: "#f0e8cc", padding: "2px 10px", borderRadius: 20, fontWeight: 700 }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ONGLET RESTAURANTS
// ============================================================
function RestaurantsTab({ park }) {
  if (!park.restaurants || park.restaurants.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px 24px", color: "#7a8aaa" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🍽️</div>
        <p style={{ fontWeight: 700, fontSize: 16 }}>Aucun restaurant référencé pour ce parc.</p>
        <p style={{ fontSize: 14, marginTop: 8 }}>Ajoutez-en via le mode Admin !</p>
      </div>
    );
  }
  return (
    <div>
      <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: 40, color: "#0d1b4b", letterSpacing: 2, marginBottom: 28 }}>RESTAURANTS</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
        {park.restaurants.map(r => (
          <div key={r.id} style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "2px solid #e8e0cc" }}>
            <div style={{ height: 160, background: "#f0e8cc", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              {r.photos?.length > 0 ? <img src={r.photos[0].url} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 48 }}>🍽️</span>}
            </div>
            <div style={{ padding: 16 }}>
              <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 22, color: "#0d1b4b", marginBottom: 6 }}>{r.name}</h3>
              <p style={{ color: "#7a8aaa", fontSize: 13, fontWeight: 600 }}>{r.type}</p>
              {r.priceRange && <p style={{ color: "#e8a500", fontWeight: 800, marginTop: 6 }}>{r.priceRange}</p>}
              {r.tip && <p style={{ color: "#0d1b4b", fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>💡 {r.tip}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// ONGLET BOUTIQUE
// ============================================================
function ShopTab({ park }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const shop = park.shop;

  if (!shop) return <div style={{ padding: 60, textAlign: "center", color: "#7a8aaa" }}>Boutique non disponible.</div>;
  if (selectedProduct) return <ProductDetail product={selectedProduct} onBack={() => setSelectedProduct(null)} parkColor={park.coverColor} />;

  const filtered = activeCategory === "all" ? shop.products : shop.products.filter(p => p.categoryId === activeCategory);
  const heartProducts = shop.products.filter(p => p.heartPick);
  const newProducts = shop.products.filter(p => p.arrivalDate);

  return (
    <div>
      <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: 40, color: "#0d1b4b", letterSpacing: 2, marginBottom: 8 }}>🛍️ BOUTIQUE</h2>
      <p style={{ color: "#7a8aaa", fontWeight: 700, marginBottom: 32 }}>{shop.products.length} produit(s) référencé(s)</p>

      {heartProducts.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 30, color: "#ec4899", letterSpacing: 1, marginBottom: 20 }}>💖 COUPS DE CŒUR</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {heartProducts.map(p => <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />)}
          </div>
        </div>
      )}

      {newProducts.length > 0 && (
        <div style={{ marginBottom: 48 }}>
          <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 30, color: "#0d9488", letterSpacing: 1, marginBottom: 20 }}>🆕 NOUVEAUTÉS</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {newProducts.map(p => <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />)}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 30, color: "#0d1b4b", letterSpacing: 1, marginBottom: 16 }}>COLLECTIONS</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setActiveCategory("all")} className="btn-primary" style={{ background: activeCategory === "all" ? "#e8c547" : "#e8e0cc", color: "#0d1b4b", fontSize: 13 }}>
            Tout ({shop.products.length})
          </button>
          {shop.categories.map(cat => {
            const count = shop.products.filter(p => p.categoryId === cat.id).length;
            if (count === 0) return null;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className="btn-primary" style={{ background: activeCategory === cat.id ? "#e8c547" : "#e8e0cc", color: "#0d1b4b", fontSize: 13 }}>
                {cat.emoji} {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length > 0
        ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {filtered.map(p => <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />)}
          </div>
        : <div style={{ textAlign: "center", padding: 60, color: "#7a8aaa" }}>Aucun produit dans cette catégorie.</div>
      }
    </div>
  );
}

function ProductCard({ product, onClick }) {
  return (
    <div onClick={onClick} className="product-card" style={{ background: "#fff", borderRadius: 16, overflow: "hidden", border: "2px solid #e8e0cc" }}>
      <div style={{ height: 200, background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {product.photos.length > 0
          ? <img src={product.photos[0].url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 48, opacity: 0.3 }}>🛍️</span>}
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {product.topSale && <span className="badge" style={{ background: "#ef4444", color: "#fff" }}>🔥 TOP</span>}
          {product.heartPick && <span className="badge" style={{ background: "#ec4899", color: "#fff" }}>💖</span>}
          {product.limitedQty && <span className="badge" style={{ background: "#7c3aed", color: "#fff" }}>⚡ LIMITÉ</span>}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <p style={{ fontSize: 11, color: "#7a8aaa", marginBottom: 4, fontWeight: 700 }}>{product.boutiques || "Toutes boutiques"}</p>
        <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 20, color: "#0d1b4b", letterSpacing: 1, marginBottom: 8 }}>{product.name}</h3>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
          {product.availableSizes.map(s => <span key={s} style={{ fontSize: 10, color: "#7a8aaa", border: "1px solid #e8e0cc", padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>{s}</span>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Bangers', cursive", fontSize: 24, color: "#e8a500" }}>{product.price.toFixed(2)} €</span>
          {product.discountEligible && !product.noDiscount && <span style={{ fontSize: 11, color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>Remises dispo</span>}
        </div>
      </div>
    </div>
  );
}

function ProductDetail({ product, onBack, parkColor }) {
  const [activePhoto, setActivePhoto] = useState(0);
  return (
    <div>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#7a8aaa", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 24, display: "flex", alignItems: "center", gap: 6 }}>← Retour à la boutique</button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
        <div>
          <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "4/3", background: "#f5f0e8", marginBottom: 10 }}>
            {product.photos.length > 0
              ? <img src={product.photos[activePhoto]?.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, opacity: 0.2 }}>🛍️</div>}
          </div>
          {product.photos.length > 1 && (
            <div style={{ display: "flex", gap: 8 }}>
              {product.photos.map((p, i) => (
                <div key={i} onClick={() => setActivePhoto(i)} style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: `2px solid ${i === activePhoto ? "#e8c547" : "transparent"}` }}>
                  <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 style={{ fontFamily: "'Bangers', cursive", fontSize: 40, color: "#0d1b4b", letterSpacing: 2, marginBottom: 8 }}>{product.name}</h1>
          {product.boutiques && <p style={{ color: "#7a8aaa", fontSize: 13, marginBottom: 16, fontWeight: 700 }}>📍 {product.isExclusivity ? "Exclusivité — " : ""}{product.boutiques}</p>}
          <p style={{ color: "#0d1b4b", lineHeight: 1.7, marginBottom: 24 }}>{product.description}</p>
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, border: "2px solid #e8e0cc", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
              <span style={{ fontFamily: "'Bangers', cursive", fontSize: 36, color: "#e8a500" }}>{product.price.toFixed(2)} €</span>
              <span style={{ fontSize: 13, color: "#7a8aaa", fontWeight: 700 }}>Prix public</span>
            </div>
            {product.discountEligible && !product.noDiscount && (
              <div>
                <span className="section-label">PRIX AVEC VOTRE PASS</span>
                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                  {DISCOUNTS.map(d => (
                    <div key={d.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f5f0e8", borderRadius: 8, padding: "10px 14px", border: `1px solid ${d.color}44` }}>
                      <div>
                        <span style={{ fontSize: 13, color: d.color, fontWeight: 700 }}>{d.label}</span>
                        <span style={{ fontSize: 11, color: "#7a8aaa", marginLeft: 8 }}>-{d.pct}%</span>
                      </div>
                      <span style={{ fontFamily: "'Bangers', cursive", fontSize: 22, color: d.color }}>{discountedPrice(product.price, d.pct)} €</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ONGLET CONSEILS & ACCÈS
// ============================================================
function ConseilsTab({ park }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
      {/* Conseil global */}
      {park.globalTip && (
        <div style={{ gridColumn: "1/-1", background: "#0d1b4b", borderRadius: 16, padding: 28 }}>
          <div style={{ fontSize: 11, color: "#e8c547", letterSpacing: 3, fontWeight: 800, marginBottom: 10 }}>💡 MON CONSEIL GLOBAL</div>
          <p style={{ color: "#e8e0d0", lineHeight: 1.8, fontSize: 16, fontWeight: 600 }}>{park.globalTip}</p>
        </div>
      )}

      {/* Accès & Transport */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "2px solid #e8e0cc" }}>
        <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 26, color: "#0d1b4b", letterSpacing: 1, marginBottom: 16 }}>🚆 ACCÈS & TRANSPORT</h3>
        {park.access?.address && <p style={{ color: "#0d1b4b", marginBottom: 8, fontWeight: 600 }}>📍 {park.access.address}</p>}
        {park.access?.transport && <p style={{ color: "#0d1b4b", lineHeight: 1.7 }}>{park.access.transport}</p>}
        {park.access?.parking && <p style={{ color: "#0d1b4b", marginTop: 10, lineHeight: 1.7 }}>🅿️ {park.access.parking}</p>}
        {park.access?.hours && <p style={{ color: "#e8a500", marginTop: 10, fontWeight: 800 }}>⏰ {park.access.hours}</p>}
        {!park.access?.address && !park.access?.transport && (
          <p style={{ color: "#7a8aaa", fontSize: 14 }}>Informations à renseigner via le mode Admin.</p>
        )}
      </div>

      {/* Billets */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "2px solid #e8e0cc" }}>
        <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 26, color: "#0d1b4b", letterSpacing: 1, marginBottom: 16 }}>🎟️ BILLETS & TARIFS</h3>
        {park.tickets?.adult && <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0e8d0" }}><span style={{ fontWeight: 700 }}>Adulte</span><span style={{ color: "#e8a500", fontWeight: 800 }}>{park.tickets.adult}</span></div>}
        {park.tickets?.child && <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0e8d0" }}><span style={{ fontWeight: 700 }}>Enfant</span><span style={{ color: "#e8a500", fontWeight: 800 }}>{park.tickets.child}</span></div>}
        {park.tickets?.annualPass && <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}><span style={{ fontWeight: 700 }}>Pass Annuel</span><span style={{ color: "#e8a500", fontWeight: 800 }}>{park.tickets.annualPass}</span></div>}
        {park.tickets?.tips && <p style={{ color: "#0d1b4b", marginTop: 12, lineHeight: 1.7, fontSize: 14 }}>💡 {park.tickets.tips}</p>}
        {!park.tickets?.adult && !park.tickets?.child && (
          <p style={{ color: "#7a8aaa", fontSize: 14 }}>Tarifs à renseigner via le mode Admin.</p>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ATTRACTION DETAIL
// ============================================================
function AttractionPage({ attraction, park, onBack }) {
  if (!attraction || !park) return null;
  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8" }}>
      <div style={{ background: park.coverColor, padding: "60px 24px 48px", position: "relative", overflow: "hidden" }}>
        <div className="stripe-accent" style={{ position: "absolute", inset: 0, opacity: 0.3 }} />
        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, padding: "6px 16px", borderRadius: 20, marginBottom: 20 }}>← {park.name}</button>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: 3, fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>{attraction.type}</div>
          <h1 style={{ fontFamily: "'Bangers', cursive", fontSize: "clamp(44px, 7vw, 76px)", color: "#fff", letterSpacing: 3, lineHeight: 0.95, marginBottom: 20 }}>{attraction.name}</h1>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div><span className="section-label" style={{ color: "rgba(255,255,255,0.5)" }}>SENSATIONS</span><ThrillStars level={attraction.thrill} /></div>
            {attraction.minHeight && <div><span className="section-label" style={{ color: "rgba(255,255,255,0.5)" }}>TAILLE MIN.</span><span style={{ color: "#e8c547", fontWeight: 800 }}>{attraction.minHeight} cm</span></div>}
            <div><span className="section-label" style={{ color: "rgba(255,255,255,0.5)" }}>DURÉE</span><span style={{ color: "#fff", fontWeight: 700 }}>{attraction.duration || "—"}</span></div>
            <div><span className="section-label" style={{ color: "rgba(255,255,255,0.5)" }}>ATTENTE MOY.</span><span style={{ color: "#fff", fontWeight: 700 }}>{attraction.waitAvg || "—"}</span></div>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            {attraction.fastpass && <span className="badge" style={{ background: "#e8c547", color: "#0d1b4b" }}>⚡ FASTPASS</span>}
            {attraction.singleRider && <span className="badge" style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>👤 SINGLE RIDER</span>}
            {!attraction.minHeight && <span className="badge" style={{ background: "rgba(22,163,74,0.3)", color: "#86efac" }}>👨‍👩‍👧 TOUT PUBLIC</span>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        {/* Tags */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 36 }}>
          {attraction.tags.map(t => <span key={t} style={{ fontSize: 12, color: "#0d1b4b", background: "#f0e8cc", padding: "4px 14px", borderRadius: 20, fontWeight: 700 }}>{t}</span>)}
        </div>

        {/* Bio IA */}
        {attraction.bio ? (
          <div style={{ background: "#fff", borderRadius: 16, padding: 32, marginBottom: 32, border: "2px solid #e8e0cc" }}>
            <div style={{ fontSize: 11, color: "#e8a500", letterSpacing: 3, fontWeight: 800, marginBottom: 16 }}>✨ PRÉSENTATION</div>
            <p style={{ color: "#0d1b4b", fontSize: 17, lineHeight: 1.8, marginBottom: 16, fontStyle: "italic", fontWeight: 600 }}>{attraction.bio.intro}</p>
            <p style={{ color: "#4a5568", lineHeight: 1.7, marginBottom: 16 }}>{attraction.bio.experience}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
              <div style={{ background: "#f5f0e8", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 10, color: "#7a8aaa", letterSpacing: 2, fontWeight: 800, marginBottom: 8 }}>IDÉAL POUR</div>
                <p style={{ color: "#0d1b4b", fontSize: 14, lineHeight: 1.6 }}>{attraction.bio.bestFor}</p>
              </div>
              <div style={{ background: "#fffbea", borderRadius: 10, padding: 16, border: "1px solid #fde68a" }}>
                <div style={{ fontSize: 10, color: "#e8a500", letterSpacing: 2, fontWeight: 800, marginBottom: 8 }}>LE SAVIEZ-VOUS ?</div>
                <p style={{ color: "#0d1b4b", fontSize: 14, lineHeight: 1.6 }}>{attraction.bio.funFact}</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: "#fff", border: "2px dashed #e8e0cc", borderRadius: 14, padding: 32, textAlign: "center", marginBottom: 32 }}>
            <p style={{ color: "#7a8aaa", fontWeight: 700 }}>Bio non encore générée — disponible en mode Admin</p>
          </div>
        )}

        {/* Conseil */}
        {attraction.tip && (
          <div style={{ borderLeft: "4px solid #e8c547", paddingLeft: 24, marginBottom: 32 }}>
            <div style={{ fontSize: 10, color: "#e8a500", letterSpacing: 3, fontWeight: 800, marginBottom: 8 }}>💡 MON CONSEIL</div>
            <p style={{ color: "#0d1b4b", lineHeight: 1.7, fontSize: 15, fontWeight: 600 }}>{attraction.tip}</p>
          </div>
        )}

        {/* Photos */}
        {attraction.photos.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: "#7a8aaa", letterSpacing: 3, fontWeight: 800, marginBottom: 16 }}>📷 PHOTOS</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(attraction.photos.length, 3)}, 1fr)`, gap: 8 }}>
              {attraction.photos.map((photo, i) => (
                <div key={i} style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "16/9" }}>
                  <img src={photo.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ADMIN PAGES
// ============================================================
function AdminHome({ data, setSelectedPark, setAdminParkView, setView, setShowAddPark, showAddPark, newPark, setNewPark, addPark }) {
  const S = { card: { background: "#fff", borderRadius: 14, padding: 20, marginBottom: 12, border: "2px solid #e8e0cc" } };
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: 48, color: "#0d1b4b", letterSpacing: 2, marginBottom: 8 }}>TABLEAU DE BORD</h2>
      <p style={{ color: "#7a8aaa", marginBottom: 36, fontWeight: 700 }}>Gérez vos parcs, attractions et boutiques</p>
      <div style={{ display: "grid", gap: 12, marginBottom: 28 }}>
        {data.parks.map(p => (
          <div key={p.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 22, color: "#0d1b4b", letterSpacing: 1 }}>{p.emoji} {p.name}</h3>
              <p style={{ color: "#7a8aaa", fontSize: 13, fontWeight: 700 }}>{p.attractions.length} attractions · {p.shop?.products.length || 0} produits · {p.restaurants?.length || 0} restos</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { setSelectedPark(p.id); setAdminParkView("attractions"); setView("admin-park"); }} className="btn-primary" style={{ fontSize: 12 }}>ATTRACTIONS</button>
              <button onClick={() => { setSelectedPark(p.id); setAdminParkView("shop"); setView("admin-park"); }} className="btn-secondary" style={{ fontSize: 12 }}>🛍️ BOUTIQUE</button>
              <button onClick={() => { setSelectedPark(p.id); setAdminParkView("info"); setView("admin-park"); }} className="btn-secondary" style={{ fontSize: 12 }}>ℹ️ INFOS</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setShowAddPark(!showAddPark)} style={{ background: "#fff", border: "2px dashed #e8c547", color: "#0d1b4b", padding: "14px 24px", borderRadius: 12, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 800, width: "100%", marginBottom: 14 }}>
        + Ajouter un parc
      </button>
      {showAddPark && (
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "2px solid #e8e0cc" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <AdminInput label="Nom du parc" value={newPark.name} onChange={v => setNewPark(p => ({ ...p, name: v }))} />
            <AdminInput label="Emoji" value={newPark.emoji} onChange={v => setNewPark(p => ({ ...p, emoji: v }))} />
            <AdminInput label="Pays" value={newPark.country} onChange={v => setNewPark(p => ({ ...p, country: v }))} />
            <AdminInput label="Année de visite" value={newPark.visited} onChange={v => setNewPark(p => ({ ...p, visited: v }))} />
          </div>
          <AdminInput label="Conseil global" value={newPark.globalTip} onChange={v => setNewPark(p => ({ ...p, globalTip: v }))} rows={2} />
          <button onClick={addPark} className="btn-primary">CRÉER LE PARC</button>
        </div>
      )}
    </div>
  );
}

function AdminPark({ park, adminParkView, setAdminParkView, data, setData, setView, setSelectedAttraction }) {
  const [showAddAttr, setShowAddAttr] = useState(false);
  const [showAddResto, setShowAddResto] = useState(false);
  const [newAttr, setNewAttr] = useState({ name: "", type: "", thrill: 3, minHeight: "", fastpass: false, singleRider: false, duration: "", waitAvg: "", tip: "", tags: "", status: "open" });
  const [newResto, setNewResto] = useState({ name: "", type: "", priceRange: "", tip: "" });
  const [accessForm, setAccessForm] = useState(park.access || { transport: "", parking: "", address: "", hours: "" });
  const [ticketsForm, setTicketsForm] = useState(park.tickets || { adult: "", child: "", annualPass: "", tips: "" });

  const tabs = [["attractions","🎢 Attractions"],["shop","🛍️ Boutique"],["restaurants","🍽️ Restos"],["info","ℹ️ Infos & Accès"]];

  const addAttraction = () => {
    if (!newAttr.name) return;
    const id = newAttr.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
    const attr = { ...newAttr, id, minHeight: newAttr.minHeight ? parseInt(newAttr.minHeight) : null, thrill: parseInt(newAttr.thrill), tags: newAttr.tags.split(",").map(t => t.trim()).filter(Boolean), bio: null, photos: [] };
    setData(d => ({ ...d, parks: d.parks.map(p => p.id === park.id ? { ...p, attractions: [...p.attractions, attr] } : p) }));
    setNewAttr({ name: "", type: "", thrill: 3, minHeight: "", fastpass: false, singleRider: false, duration: "", waitAvg: "", tip: "", tags: "", status: "open" });
    setShowAddAttr(false);
  };

  const addResto = () => {
    if (!newResto.name) return;
    const id = newResto.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    const r = { ...newResto, id, photos: [] };
    setData(d => ({ ...d, parks: d.parks.map(p => p.id === park.id ? { ...p, restaurants: [...(p.restaurants || []), r] } : p) }));
    setNewResto({ name: "", type: "", priceRange: "", tip: "" });
    setShowAddResto(false);
  };

  const saveInfo = () => {
    setData(d => ({ ...d, parks: d.parks.map(p => p.id === park.id ? { ...p, access: accessForm, tickets: ticketsForm } : p) }));
    alert("Infos sauvegardées !");
  };

  return (
    <div>
      {/* Tab bar */}
      <div style={{ background: "#0d1b4b", display: "flex", justifyContent: "center", gap: 4, padding: "0 24px" }}>
        {tabs.map(([tab, label]) => (
          <button key={tab} onClick={() => setAdminParkView(tab)} style={{ background: adminParkView === tab ? "#e8c547" : "transparent", color: adminParkView === tab ? "#0d1b4b" : "rgba(255,255,255,0.6)", border: "none", borderBottom: adminParkView === tab ? "none" : "none", padding: "14px 20px", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 800, borderRadius: "10px 10px 0 0" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: 40, color: "#0d1b4b", letterSpacing: 2, marginBottom: 28 }}>{park.emoji} {park.name}</h2>

        {/* ATTRACTIONS */}
        {adminParkView === "attractions" && (
          <div>
            <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
              {park.attractions.map(attr => (
                <div key={attr.id} style={{ background: "#fff", borderRadius: 12, padding: 18, border: "2px solid #e8e0cc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 20, color: "#0d1b4b", letterSpacing: 1, marginBottom: 4 }}>{attr.name}</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                      {attr.bio && <span style={{ fontSize: 11, color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>✓ Bio IA</span>}
                      {attr.photos.length > 0 && <span style={{ fontSize: 11, color: "#2563eb", background: "#dbeafe", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>{attr.photos.length} photo(s)</span>}
                    </div>
                  </div>
                  <button onClick={() => { setSelectedAttraction(attr.id); setView("admin-attraction"); }} className="btn-primary" style={{ fontSize: 12 }}>ÉDITER</button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAddAttr(!showAddAttr)} style={{ background: "#fff", border: "2px dashed #e8c547", color: "#0d1b4b", padding: "12px 24px", borderRadius: 12, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 800, width: "100%", marginBottom: 16 }}>
              + Ajouter une attraction
            </button>
            {showAddAttr && (
              <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "2px solid #e8e0cc" }}>
                <AdminInput label="Nom" value={newAttr.name} onChange={v => setNewAttr(p => ({ ...p, name: v }))} />
                <AdminInput label="Type" value={newAttr.type} placeholder="ex: Montagne russe" onChange={v => setNewAttr(p => ({ ...p, type: v }))} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <AdminInput label="Durée" value={newAttr.duration} onChange={v => setNewAttr(p => ({ ...p, duration: v }))} />
                  <AdminInput label="Attente moyenne" value={newAttr.waitAvg} onChange={v => setNewAttr(p => ({ ...p, waitAvg: v }))} />
                  <AdminInput label="Taille min (cm)" type="number" value={newAttr.minHeight} onChange={v => setNewAttr(p => ({ ...p, minHeight: v }))} />
                  <div>
                    <span className="section-label">SENSATIONS ({newAttr.thrill}/5)</span>
                    <input type="range" min="1" max="5" value={newAttr.thrill} onChange={e => setNewAttr(p => ({ ...p, thrill: e.target.value }))} style={{ width: "100%", accentColor: "#e8c547" }} />
                  </div>
                </div>
                <AdminInput label="Tags (séparés par virgule)" value={newAttr.tags} onChange={v => setNewAttr(p => ({ ...p, tags: v }))} placeholder="ex: Famille, Must-do" />
                <AdminInput label="Mon conseil" value={newAttr.tip} onChange={v => setNewAttr(p => ({ ...p, tip: v }))} rows={2} />
                <button onClick={addAttraction} className="btn-primary">AJOUTER L'ATTRACTION</button>
              </div>
            )}
          </div>
        )}

        {/* BOUTIQUE */}
        {adminParkView === "shop" && <AdminShop park={park} onUpdate={(shop) => setData(d => ({ ...d, parks: d.parks.map(p => p.id === park.id ? { ...p, shop } : p) }))} />}

        {/* RESTAURANTS */}
        {adminParkView === "restaurants" && (
          <div>
            <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
              {(park.restaurants || []).map(r => (
                <div key={r.id} style={{ background: "#fff", borderRadius: 12, padding: 18, border: "2px solid #e8e0cc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 20, color: "#0d1b4b" }}>{r.name}</h3>
                    <p style={{ color: "#7a8aaa", fontSize: 13, fontWeight: 700 }}>{r.type} {r.priceRange ? `· ${r.priceRange}` : ""}</p>
                  </div>
                  <button onClick={() => setData(d => ({ ...d, parks: d.parks.map(p => p.id === park.id ? { ...p, restaurants: p.restaurants.filter(x => x.id !== r.id) } : p) }))} style={{ background: "#fee2e2", border: "none", color: "#ef4444", cursor: "pointer", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>Supprimer</button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAddResto(!showAddResto)} style={{ background: "#fff", border: "2px dashed #e8c547", color: "#0d1b4b", padding: "12px 24px", borderRadius: 12, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 14, fontWeight: 800, width: "100%", marginBottom: 16 }}>
              + Ajouter un restaurant
            </button>
            {showAddResto && (
              <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "2px solid #e8e0cc" }}>
                <AdminInput label="Nom du restaurant" value={newResto.name} onChange={v => setNewResto(p => ({ ...p, name: v }))} />
                <AdminInput label="Type" value={newResto.type} placeholder="ex: Buffet, Table service..." onChange={v => setNewResto(p => ({ ...p, type: v }))} />
                <AdminInput label="Fourchette de prix" value={newResto.priceRange} placeholder="ex: 15–30€" onChange={v => setNewResto(p => ({ ...p, priceRange: v }))} />
                <AdminInput label="Mon conseil" value={newResto.tip} onChange={v => setNewResto(p => ({ ...p, tip: v }))} rows={2} />
                <button onClick={addResto} className="btn-primary">AJOUTER LE RESTAURANT</button>
              </div>
            )}
          </div>
        )}

        {/* INFOS & ACCÈS */}
        {adminParkView === "info" && (
          <div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "2px solid #e8e0cc", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 24, color: "#0d1b4b", marginBottom: 16 }}>🚆 Accès & Transport</h3>
              <AdminInput label="Adresse" value={accessForm.address} onChange={v => setAccessForm(f => ({ ...f, address: v }))} placeholder="Adresse du parc" />
              <AdminInput label="Transports en commun" value={accessForm.transport} onChange={v => setAccessForm(f => ({ ...f, transport: v }))} rows={2} placeholder="RER, Bus, Métro..." />
              <AdminInput label="Parking" value={accessForm.parking} onChange={v => setAccessForm(f => ({ ...f, parking: v }))} rows={2} placeholder="Infos parking..." />
              <AdminInput label="Horaires d'ouverture" value={accessForm.hours} onChange={v => setAccessForm(f => ({ ...f, hours: v }))} placeholder="ex: 9h–22h en été" />
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 24, border: "2px solid #e8e0cc", marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 24, color: "#0d1b4b", marginBottom: 16 }}>🎟️ Billets & Tarifs</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <AdminInput label="Tarif adulte" value={ticketsForm.adult} onChange={v => setTicketsForm(f => ({ ...f, adult: v }))} placeholder="ex: 59€" />
                <AdminInput label="Tarif enfant" value={ticketsForm.child} onChange={v => setTicketsForm(f => ({ ...f, child: v }))} placeholder="ex: 49€" />
                <AdminInput label="Pass annuel" value={ticketsForm.annualPass} onChange={v => setTicketsForm(f => ({ ...f, annualPass: v }))} placeholder="ex: dès 199€/an" />
              </div>
              <AdminInput label="Conseils billets" value={ticketsForm.tips} onChange={v => setTicketsForm(f => ({ ...f, tips: v }))} rows={2} placeholder="Acheter en ligne, jours creux..." />
            </div>
            <button onClick={saveInfo} className="btn-primary" style={{ padding: "12px 32px" }}>💾 SAUVEGARDER</button>
          </div>
        )}
      </div>
    </div>
  );
}

function AdminAttractionPage({ attraction, park, setData, onBack }) {
  if (!attraction || !park) return null;
  const handleBioGenerated = (bio) => {
    setData(d => ({ ...d, parks: d.parks.map(p => p.id === park.id ? { ...p, attractions: p.attractions.map(a => a.id === attraction.id ? { ...a, bio } : a) } : p) }));
  };
  const [uploading, setUploading] = useState(false);
  const handlePhotoUpload = async (files) => {
    setUploading(true);
    try {
      const newPhotos = await Promise.all(Array.from(files).map(uploadToCloudinary));
      setData(d => ({ ...d, parks: d.parks.map(p => p.id === park.id ? { ...p, attractions: p.attractions.map(a => a.id === attraction.id ? { ...a, photos: [...a.photos, ...newPhotos] } : a) } : p) }));
    } catch (e) { alert("Erreur upload : " + e.message); }
    setUploading(false);
  };
  const updateTip = (val) => {
    setData(d => ({ ...d, parks: d.parks.map(p => p.id === park.id ? { ...p, attractions: p.attractions.map(a => a.id === attraction.id ? { ...a, tip: val } : a) } : p) }));
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#7a8aaa", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, marginBottom: 24 }}>← {park.name}</button>
      <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: 42, color: "#0d1b4b", letterSpacing: 2, marginBottom: 28 }}>{attraction.name}</h2>

      <div style={{ background: "#fff", borderRadius: 16, padding: 28, marginBottom: 20, border: "2px solid #e8e0cc" }}>
        <div style={{ fontSize: 11, color: "#7a8aaa", letterSpacing: 3, fontWeight: 800, marginBottom: 16 }}>✨ BIO IA</div>
        {attraction.bio && <p style={{ color: "#16a34a", fontSize: 13, marginBottom: 12, fontWeight: 700 }}>✓ Bio générée — {attraction.bio.intro?.substring(0, 80)}...</p>}
        <AIBioGenerator attraction={attraction} parkName={park.name} onBioGenerated={handleBioGenerated} />
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 28, marginBottom: 20, border: "2px solid #e8e0cc" }}>
        <div style={{ fontSize: 11, color: "#7a8aaa", letterSpacing: 3, fontWeight: 800, marginBottom: 16 }}>📷 PHOTOS ({attraction.photos.length})</div>
        {attraction.photos.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginBottom: 16 }}>
            {attraction.photos.map((photo, i) => (
              <div key={i} style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "4/3", position: "relative" }}>
                <img src={photo.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <button onClick={() => { deleteFromCloudinary(photo.public_id); setData(d => ({ ...d, parks: d.parks.map(p => p.id === park.id ? { ...p, attractions: p.attractions.map(a => a.id === attraction.id ? { ...a, photos: a.photos.filter((_, idx) => idx !== i) } : a) } : p) })); }} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 12 }}>×</button>
              </div>
            ))}
          </div>
        )}
        <div onClick={() => { if (uploading) return; const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.multiple = true; input.onchange = e => handlePhotoUpload(e.target.files); input.click(); }}
          style={{ border: "2px dashed #e8e0cc", borderRadius: 12, padding: 24, textAlign: "center", cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.7 : 1 }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "#e8c547"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "#e8e0cc"}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>{uploading ? "⏳" : "📸"}</div>
          <p style={{ color: "#7a8aaa", fontSize: 13, fontWeight: 700 }}>{uploading ? "Upload en cours..." : "Cliquez pour ajouter des photos"}</p>
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, padding: 28, border: "2px solid #e8e0cc" }}>
        <div style={{ fontSize: 11, color: "#7a8aaa", letterSpacing: 3, fontWeight: 800, marginBottom: 16 }}>💡 MON CONSEIL</div>
        <textarea value={attraction.tip} onChange={e => updateTip(e.target.value)} rows={4} className="input-field" style={{ resize: "vertical" }} />
      </div>
    </div>
  );
}

// ============================================================
// ADMIN SHOP (inchangé dans la logique, redesigné)
// ============================================================
function AdminShop({ park, onUpdate }) {
  const [view, setView] = useState("home");
  const [editProduct, setEditProduct] = useState(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("🏷️");
  const shop = park.shop || { categories: [], products: [] };

  const EMPTY_PRODUCT = { id: "", name: "", categoryId: shop.categories[0]?.id || "", description: "", price: "", photos: [], sizes: { adulte: [], enfant: [] }, availableSizes: [], discountEligible: true, noDiscount: false, boutiques: "", isExclusivity: false, topSale: false, heartPick: false, arrivalDate: "", limitedQty: false, limitedNote: "", tags: [] };
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const openAdd = () => { setForm(EMPTY_PRODUCT); setEditProduct(null); setView("add-product"); };
  const openEdit = (p) => { setForm({ ...p }); setEditProduct(p.id); setView("add-product"); };

  const [uploading, setUploading] = useState(false);
  const handlePhotoUpload = async (files) => {
    setUploading(true);
    try {
      const newPhotos = await Promise.all(Array.from(files).map(uploadToCloudinary));
      setF("photos", [...form.photos, ...newPhotos]);
    } catch (e) { alert("Erreur upload : " + e.message); }
    setUploading(false);
  };
  const toggleSize = (size) => setForm(f => ({ ...f, availableSizes: f.availableSizes.includes(size) ? f.availableSizes.filter(s => s !== size) : [...f.availableSizes, size] }));
  const toggleSizeType = (type, size) => setForm(f => { const current = f.sizes[type]; const updated = current.includes(size) ? current.filter(s => s !== size) : [...current, size]; return { ...f, sizes: { ...f.sizes, [type]: updated } }; });
  const saveProduct = () => {
    if (!form.name) return;
    const id = form.id || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
    const product = { ...form, id, price: parseFloat(form.price) || 0 };
    const products = editProduct ? shop.products.map(p => p.id === editProduct ? product : p) : [...shop.products, product];
    onUpdate({ ...shop, products });
    setView("home");
  };
  const deleteProduct = (id) => onUpdate({ ...shop, products: shop.products.filter(p => p.id !== id) });
  const addCategory = () => { if (!newCatName) return; const id = newCatName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""); onUpdate({ ...shop, categories: [...shop.categories, { id, name: newCatName, emoji: newCatEmoji }] }); setNewCatName(""); setNewCatEmoji("🏷️"); };

  const CB = (active, color = "#e8c547") => ({ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", background: active ? color + "22" : "#f5f0e8", border: `1px solid ${active ? color : "#e8e0cc"}`, borderRadius: 8, padding: "6px 14px", color: active ? color : "#7a8aaa", fontSize: 13, fontWeight: 700 });

  if (view === "add-product") return (
    <div>
      <button onClick={() => setView("home")} style={{ background: "transparent", border: "none", color: "#7a8aaa", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, marginBottom: 24 }}>← Retour</button>
      <h2 style={{ fontFamily: "'Bangers', cursive", fontSize: 40, color: "#0d1b4b", letterSpacing: 2, marginBottom: 28 }}>{editProduct ? "✏️ MODIFIER" : "➕ NOUVEAU PRODUIT"}</h2>
      {[
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, marginBottom: 16, border: "2px solid #e8e0cc" }}>
          <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 22, color: "#0d1b4b", marginBottom: 16 }}>📦 Informations générales</h3>
          <AdminInput label="Nom du produit *" value={form.name} onChange={v => setF("name", v)} />
          <div style={{ marginBottom: 14 }}><span className="section-label">CATÉGORIE</span><select value={form.categoryId} onChange={e => setF("categoryId", e.target.value)} className="input-field">{shop.categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}</select></div>
          <AdminInput label="Description" value={form.description} onChange={v => setF("description", v)} rows={3} />
          <AdminInput label="Prix (€) *" type="number" value={form.price} onChange={v => setF("price", v)} />
        </div>,
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, marginBottom: 16, border: "2px solid #e8e0cc" }}>
          <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 22, color: "#0d1b4b", marginBottom: 16 }}>📏 Tailles</h3>
          <span className="section-label">TAILLES ADULTE PROPOSÉES</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>{SIZES_ADULTE.map(s => <span key={s} onClick={() => toggleSizeType("adulte", s)} style={CB(form.sizes.adulte.includes(s))}>{s}</span>)}</div>
          <span className="section-label">TAILLES ENFANT PROPOSÉES</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>{SIZES_ENFANT.map(s => <span key={s} onClick={() => toggleSizeType("enfant", s)} style={CB(form.sizes.enfant.includes(s))}>{s}</span>)}</div>
          <span className="section-label">DISPONIBLES EN STOCK</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{[...form.sizes.adulte, ...form.sizes.enfant].map(s => <span key={s} onClick={() => toggleSize(s)} style={CB(form.availableSizes.includes(s), "#16a34a")}>{s} {form.availableSizes.includes(s) ? "✓" : "✗"}</span>)}</div>
        </div>,
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, marginBottom: 16, border: "2px solid #e8e0cc" }}>
          <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 22, color: "#0d1b4b", marginBottom: 16 }}>💰 Remises</h3>
          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <span onClick={() => { setF("discountEligible", true); setF("noDiscount", false); }} style={CB(form.discountEligible && !form.noDiscount, "#16a34a")}>✅ Remises applicables</span>
            <span onClick={() => { setF("discountEligible", false); setF("noDiscount", true); }} style={CB(form.noDiscount, "#ef4444")}>🚫 Aucune remise</span>
          </div>
        </div>,
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, marginBottom: 16, border: "2px solid #e8e0cc" }}>
          <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 22, color: "#0d1b4b", marginBottom: 16 }}>📍 Boutique & Badges</h3>
          <AdminInput label="Boutiques concernées" value={form.boutiques} onChange={v => setF("boutiques", v)} />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
            <span onClick={() => setF("topSale", !form.topSale)} style={CB(form.topSale, "#ef4444")}>🔥 TOP VENTE</span>
            <span onClick={() => setF("heartPick", !form.heartPick)} style={CB(form.heartPick, "#ec4899")}>💖 COUP DE CŒUR</span>
            <span onClick={() => setF("isExclusivity", !form.isExclusivity)} style={CB(form.isExclusivity, "#7c3aed")}>⭐ EXCLUSIVITÉ</span>
            <span onClick={() => setF("limitedQty", !form.limitedQty)} style={CB(form.limitedQty, "#7c3aed")}>⚡ LIMITÉ</span>
          </div>
          <AdminInput label="Date d'arrivée" value={form.arrivalDate} onChange={v => setF("arrivalDate", v)} placeholder="ex: 15 Mars" />
        </div>,
        <div style={{ background: "#fff", borderRadius: 14, padding: 24, marginBottom: 20, border: "2px solid #e8e0cc" }}>
          <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 22, color: "#0d1b4b", marginBottom: 16 }}>📷 Photos ({form.photos.length})</h3>
          {form.photos.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 12 }}>{form.photos.map((p, i) => <div key={i} style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "1", position: "relative" }}><img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /><button onClick={() => { deleteFromCloudinary(p.public_id); setF("photos", form.photos.filter((_, idx) => idx !== i)); }} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "50%", width: 20, height: 20, cursor: "pointer", fontSize: 11 }}>×</button></div>)}</div>}
          <div onClick={() => { if (uploading) return; const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.multiple = true; i.onchange = e => handlePhotoUpload(e.target.files); i.click(); }} style={{ border: "2px dashed #e8e0cc", borderRadius: 12, padding: 20, textAlign: "center", cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.7 : 1 }} onMouseEnter={e => e.currentTarget.style.borderColor = "#e8c547"} onMouseLeave={e => e.currentTarget.style.borderColor = "#e8e0cc"}><div style={{ fontSize: 28, marginBottom: 4 }}>{uploading ? "⏳" : "📸"}</div><p style={{ color: "#7a8aaa", fontSize: 13, fontWeight: 700 }}>{uploading ? "Upload en cours..." : "Cliquez pour ajouter des photos"}</p></div>
        </div>
      ].map((el, i) => <div key={i}>{el}</div>)}
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={saveProduct} className="btn-primary" style={{ padding: "12px 28px" }}>{editProduct ? "💾 ENREGISTRER" : "✅ AJOUTER"}</button>
        <button onClick={() => setView("home")} className="btn-secondary" style={{ padding: "12px 20px" }}>Annuler</button>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <button onClick={openAdd} className="btn-primary">+ NOUVEAU PRODUIT</button>
        <button onClick={() => setView("categories")} className="btn-secondary">🗂️ CATÉGORIES</button>
      </div>
      {shop.products.length === 0
        ? <div style={{ textAlign: "center", padding: 60, border: "2px dashed #e8e0cc", borderRadius: 14, color: "#7a8aaa" }}><div style={{ fontSize: 48, marginBottom: 12 }}>🛍️</div><p style={{ fontWeight: 700 }}>Aucun produit</p><button onClick={openAdd} className="btn-primary" style={{ marginTop: 16 }}>+ Ajouter</button></div>
        : <div style={{ display: "grid", gap: 10 }}>{shop.products.map(p => (
            <div key={p.id} style={{ background: "#fff", borderRadius: 12, padding: 18, border: "2px solid #e8e0cc", display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 16, alignItems: "center" }}>
              <div style={{ width: 60, height: 60, borderRadius: 8, overflow: "hidden", background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.photos.length > 0 ? <img src={p.photos[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 24, opacity: 0.3 }}>🛍️</span>}
              </div>
              <div>
                <h3 style={{ fontFamily: "'Bangers', cursive", fontSize: 18, color: "#0d1b4b" }}>{p.name}</h3>
                <p style={{ color: "#7a8aaa", fontSize: 12, fontWeight: 700 }}>{shop.categories.find(c => c.id === p.categoryId)?.name || "—"} · {p.price.toFixed(2)} €</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openEdit(p)} className="btn-primary" style={{ fontSize: 12 }}>ÉDITER</button>
                <button onClick={() => deleteProduct(p.id)} style={{ background: "#fee2e2", border: "none", color: "#ef4444", cursor: "pointer", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>✕</button>
              </div>
            </div>
          ))}</div>
      }
    </div>
  );
}

// ============================================================
// LOGIN ADMIN
// ============================================================
function AdminLogin({ setMode, setAdminUnlocked }) {
  const [pw, setPw] = useState("");
  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 40, border: "2px solid #e8e0cc", width: 360, boxShadow: "0 8px 32px rgba(13,27,75,0.1)" }}>
        <div style={{ fontFamily: "'Bangers', cursive", fontSize: 32, color: "#0d1b4b", marginBottom: 4, letterSpacing: 2 }}>ACCÈS ADMIN</div>
        <p style={{ color: "#7a8aaa", fontSize: 13, marginBottom: 24, fontWeight: 700 }}>Mot de passe : <span style={{ color: "#0d1b4b" }}>admin</span></p>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && pw === "admin" && setAdminUnlocked(true)} placeholder="Mot de passe..." className="input-field" style={{ marginBottom: 14 }} />
        <button onClick={() => pw === "admin" && setAdminUnlocked(true)} className="btn-primary" style={{ width: "100%", padding: 12 }}>ENTRER</button>
        <button onClick={() => setMode("visitor")} style={{ width: "100%", background: "transparent", border: "none", color: "#7a8aaa", cursor: "pointer", marginTop: 12, fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700 }}>← Retour au blog</button>
      </div>
    </div>
  );
}

// ============================================================
// APP PRINCIPALE
// ============================================================
export default function ParkBlog() {
  const [data, setData] = useState(INITIAL_DATA);
  const [mode, setMode] = useState("visitor");
  const [view, setView] = useState("home");
  const [selectedPark, setSelectedPark] = useState(null);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [parkTab, setParkTab] = useState("attractions");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [showAddPark, setShowAddPark] = useState(false);
  const [newPark, setNewPark] = useState({ name: "", country: "", emoji: "🎢", visited: new Date().getFullYear().toString(), globalTip: "" });
  const [adminParkView, setAdminParkView] = useState("attractions");

  const park = selectedPark ? data.parks.find(p => p.id === selectedPark) : null;
  const attraction = park && selectedAttraction ? park.attractions.find(a => a.id === selectedAttraction) : null;

  const addPark = () => {
    if (!newPark.name) return;
    const id = newPark.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setData(d => ({ ...d, parks: [...d.parks, { ...newPark, id, coverColor: "#1a1a6e", accentColor: "#e8c547", heroImage: null, attractions: [], restaurants: [], access: { transport: "", parking: "", address: "", hours: "" }, tickets: { adult: "", child: "", annualPass: "", tips: "" }, shop: { categories: [], products: [] } }] }));
    setNewPark({ name: "", country: "", emoji: "🎢", visited: new Date().getFullYear().toString(), globalTip: "" });
    setShowAddPark(false);
  };

  if (!adminUnlocked && mode === "admin") {
    return (
      <>
        <style>{CSS}</style>
        <Nav mode={mode} setMode={setMode} setView={setView} selectedPark={selectedPark} setSelectedPark={setSelectedPark} setSelectedAttraction={setSelectedAttraction} setParkTab={setParkTab} setAdminParkView={setAdminParkView} data={data} adminUnlocked={adminUnlocked} />
        <AdminLogin setMode={setMode} setAdminUnlocked={setAdminUnlocked} />
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <Nav mode={mode} setMode={setMode} setView={setView} selectedPark={selectedPark} setSelectedPark={setSelectedPark} setSelectedAttraction={setSelectedAttraction} setParkTab={setParkTab} setAdminParkView={setAdminParkView} data={data} adminUnlocked={adminUnlocked} />
      <main>
        {mode === "visitor" && view === "home" && <HomePage data={data} setSelectedPark={setSelectedPark} setParkTab={setParkTab} setView={setView} />}
        {mode === "visitor" && view === "park" && park && <ParkPage park={park} parkTab={parkTab} setParkTab={setParkTab} setSelectedAttraction={setSelectedAttraction} setView={setView} />}
        {mode === "visitor" && view === "attraction" && <AttractionPage attraction={attraction} park={park} onBack={() => setView("park")} />}
        {mode === "admin" && view === "admin-home" && <AdminHome data={data} setSelectedPark={setSelectedPark} setAdminParkView={setAdminParkView} setView={setView} setShowAddPark={setShowAddPark} showAddPark={showAddPark} newPark={newPark} setNewPark={setNewPark} addPark={addPark} />}
        {mode === "admin" && view === "admin-park" && park && <AdminPark park={park} adminParkView={adminParkView} setAdminParkView={setAdminParkView} data={data} setData={setData} setView={setView} setSelectedAttraction={setSelectedAttraction} />}
        {mode === "admin" && view === "admin-attraction" && attraction && <AdminAttractionPage attraction={attraction} park={park} setData={setData} onBack={() => setView("admin-park")} />}
      </main>
    </>
  );
}
