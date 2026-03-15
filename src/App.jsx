import { useState, useEffect, useRef } from "react";

// ============================================================
// CONFIG
// ============================================================
const API_URL = "https://sami-parks-api.sammy-avcuoglu.workers.dev";
const CLOUDINARY_CLOUD_NAME = "dgllplwhr";
const CLOUDINARY_UPLOAD_PRESET = "park-blog";
const CLOUDINARY_DELETE_WORKER = "https://sami-parks-cloudinary-delete.sammy-avcuoglu.workers.dev";

const C = {
  bg: "#d4d38f",
  header: "#050a30",
  accent: "#e8c547",
  text: "#050a30",
  light: "#f0ef9a",
  card: "#fff",
  muted: "#6b6b3a",
};

async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
  const data = await res.json();
  if (!data.secure_url) throw new Error("Upload échoué");
  return { url: data.secure_url, caption: file.name, public_id: data.public_id };
}

async function deleteFromCloudinary(public_id) {
  if (!public_id) return;
  try { await fetch(CLOUDINARY_DELETE_WORKER, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ public_id }) }); } catch {}
}

// ============================================================
// DONNÉES INITIALES
// ============================================================
const INITIAL_DATA = {
  profile: { name: "Sami", bio: "Passionné de parcs d'attractions depuis toujours.", photo: null },
  homeBlocks: [],
  parks: [{
    id: "disneyland-paris", name: "Disneyland Paris", emoji: "🏰",
    logo: null, country: "France", coverColor: "#1a1a6e", visited: "2023",
    globalTip: "", heroImage: null, blocks: [],
    attractions: [], restaurants: [],
    shop: { categories: [
      { id: "vetements-homme", name: "Vêtements Homme", emoji: "👔" },
      { id: "peluches", name: "Peluches", emoji: "🧸" },
      { id: "accessoires", name: "Accessoires", emoji: "👜" },
    ], products: [] },
  }],
};

const DISCOUNTS = [
  { key: "cm", label: "CM (Cast Member)", pct: 25, color: "#7c3aed" },
  { key: "gold", label: "Pass Annuel Gold", pct: 15, color: "#d97706" },
  { key: "silver", label: "Pass Annuel Silver", pct: 10, color: "#64748b" },
];

function discountedPrice(price, pct) { return (price * (1 - pct / 100)).toFixed(2); }

// ============================================================
// CSS GLOBAL
// ============================================================
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Passion+One:wght@400;700;900&family=Nunito:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: ${C.bg}; color: ${C.text}; font-family: 'Nunito', sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #c8c76a; }
  ::-webkit-scrollbar-thumb { background: ${C.header}; border-radius: 3px; }

  h1, h2, h3, h4 { font-family: 'Passion One', cursive; letter-spacing: 1px; }

  .park-card { transition: transform 0.25s, box-shadow 0.25s; cursor: pointer; }
  .park-card:hover { transform: translateY(-6px); box-shadow: 0 12px 32px rgba(5,10,48,0.2); }

  .attr-card { transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
  .attr-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(5,10,48,0.15); }

  .btn-primary {
    background: ${C.accent}; color: ${C.header}; border: none;
    padding: 10px 24px; border-radius: 30px; font-family: 'Passion One', cursive;
    font-weight: 400; font-size: 16px; cursor: pointer; transition: all 0.2s;
    letter-spacing: 1px;
  }
  .btn-primary:hover { background: #f5d84a; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(232,197,71,0.5); }

  .btn-secondary {
    background: ${C.header}; color: ${C.accent}; border: none;
    padding: 10px 24px; border-radius: 30px; font-family: 'Passion One', cursive;
    font-weight: 400; font-size: 16px; cursor: pointer; transition: all 0.2s;
  }
  .btn-secondary:hover { background: #0a1560; transform: translateY(-1px); }

  .nav-link { transition: color 0.2s; }
  .nav-link:hover { color: ${C.accent} !important; }

  .tab-btn { transition: all 0.2s; cursor: pointer; }
  .tab-btn:hover { background: rgba(232,197,71,0.15) !important; }

  .product-card { transition: transform 0.25s, box-shadow 0.25s; cursor: pointer; }
  .product-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(5,10,48,0.15); }

  .star { font-size: 15px; }
  .thrill-star-on { color: ${C.accent}; }
  .thrill-star-off { color: #b8b76a; }

  .block-render img { max-width: 100%; border-radius: 12px; }

  /* Carousel */
  .carousel-container { position: relative; overflow: hidden; border-radius: 16px; }
  .carousel-track { display: flex; transition: transform 0.4s ease; }
  .carousel-slide { min-width: 100%; }
  .carousel-slide img { width: 100%; height: 400px; object-fit: cover; }
  .carousel-btn {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: rgba(5,10,48,0.7); color: #fff; border: none;
    width: 44px; height: 44px; border-radius: 50%; cursor: pointer;
    font-size: 18px; display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .carousel-btn:hover { background: rgba(5,10,48,0.9); }
  .carousel-btn-left { left: 12px; }
  .carousel-btn-right { right: 12px; }
`;

// ============================================================
// HASH ROUTER
// ============================================================
function parseHash() {
  const hash = window.location.hash.replace("#", "") || "/";
  const parts = hash.split("/").filter(Boolean);
  if (parts.length === 0) return { view: "home" };
  if (parts[0] === "parc" && parts[1]) {
    if (parts[2] === "attraction" && parts[3]) return { view: "attraction", parkId: parts[1], attractionId: parts[3] };
    return { view: "park", parkId: parts[1], tab: parts[2] || "attractions" };
  }
  return { view: "home" };
}

function navigate(path) { window.location.hash = path; }

// ============================================================
// BLOCK RENDERER
// ============================================================
function Carousel({ images }) {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) return null;
  return (
    <div className="carousel-container">
      <div className="carousel-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {images.map((img, i) => (
          <div key={i} className="carousel-slide">
            <img src={img.url} alt={img.caption || ""} />
            {img.caption && <div style={{ textAlign: "center", padding: "8px 0", fontSize: 13, color: C.muted, fontStyle: "italic" }}>{img.caption}</div>}
          </div>
        ))}
      </div>
      {images.length > 1 && <>
        <button className="carousel-btn carousel-btn-left" onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}>‹</button>
        <button className="carousel-btn carousel-btn-right" onClick={() => setIdx(i => (i + 1) % images.length)}>›</button>
        <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
          {images.map((_, i) => <div key={i} onClick={() => setIdx(i)} style={{ width: 8, height: 8, borderRadius: "50%", background: i === idx ? C.accent : "rgba(255,255,255,0.5)", cursor: "pointer" }} />)}
        </div>
      </>}
    </div>
  );
}

function BlockRenderer({ blocks }) {
  if (!blocks || blocks.length === 0) return null;
  return (
    <div className="block-render" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {blocks.map((block, i) => {
        if (block.type === "bandeau") return (
          <div key={i} style={{ background: block.color || C.header, color: block.textColor || "#fff", padding: "24px 32px", borderRadius: 12, textAlign: "center" }}>
            {block.title && <h2 style={{ fontSize: 32, marginBottom: block.text ? 8 : 0 }}>{block.title}</h2>}
            {block.text && <p style={{ fontSize: 16, opacity: 0.9, fontFamily: "'Nunito', sans-serif" }}>{block.text}</p>}
          </div>
        );
        if (block.type === "photo") return (
          <div key={i} style={{ textAlign: "center" }}>
            <img src={block.url} alt={block.caption || ""} style={{ maxWidth: "100%", borderRadius: 12, boxShadow: "0 4px 20px rgba(5,10,48,0.15)" }} />
            {block.caption && <p style={{ marginTop: 8, color: C.muted, fontSize: 13, fontStyle: "italic" }}>{block.caption}</p>}
          </div>
        );
        if (block.type === "carousel") return <Carousel key={i} images={block.images || []} />;
        if (block.type === "texte") return (
          <div key={i} style={{ background: "rgba(255,255,255,0.6)", borderRadius: 12, padding: "24px 28px" }}>
            {block.title && <h2 style={{ fontSize: 28, marginBottom: 12, color: C.header }}>{block.title}</h2>}
            {block.text && <p style={{ lineHeight: 1.8, color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 15 }}>{block.text}</p>}
          </div>
        );
        if (block.type === "texte_image") return (
          <div key={i} style={{ display: "grid", gridTemplateColumns: block.imageLeft ? "1fr 1fr" : "1fr 1fr", gap: 24, alignItems: "center" }}>
            {block.imageLeft ? <>
              <img src={block.url} alt="" style={{ width: "100%", borderRadius: 12 }} />
              <div>
                {block.title && <h2 style={{ fontSize: 28, marginBottom: 12 }}>{block.title}</h2>}
                {block.text && <p style={{ lineHeight: 1.8, fontFamily: "'Nunito', sans-serif" }}>{block.text}</p>}
              </div>
            </> : <>
              <div>
                {block.title && <h2 style={{ fontSize: 28, marginBottom: 12 }}>{block.title}</h2>}
                {block.text && <p style={{ lineHeight: 1.8, fontFamily: "'Nunito', sans-serif" }}>{block.text}</p>}
              </div>
              <img src={block.url} alt="" style={{ width: "100%", borderRadius: 12 }} />
            </>}
          </div>
        );
        if (block.type === "galerie") return (
          <div key={i}>
            {block.title && <h2 style={{ fontSize: 28, marginBottom: 16 }}>{block.title}</h2>}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {(block.images || []).map((img, j) => (
                <div key={j} style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "1" }}>
                  <img src={img.url} alt={img.caption || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              ))}
            </div>
          </div>
        );
        return null;
      })}
    </div>
  );
}

// ============================================================
// COMPOSANTS UTILITAIRES
// ============================================================
function ThrillStars({ level }) {
  return <span>{Array.from({ length: 5 }, (_, i) => <span key={i} className={`star ${i < level ? "thrill-star-on" : "thrill-star-off"}`}>★</span>)}</span>;
}

// ============================================================
// NAVIGATION
// ============================================================
function Nav({ route, data }) {
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 100, background: C.header, borderBottom: `3px solid ${C.accent}`, padding: "0 24px", display: "flex", alignItems: "center", height: 64, gap: 20 }}>
      <div onClick={() => navigate("/")} style={{ fontFamily: "'Passion One', cursive", fontSize: 28, color: C.accent, cursor: "pointer", letterSpacing: 2 }}>
        SAMI<span style={{ color: "#fff" }}>PARKS</span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {data.parks.map(p => (
          <button key={p.id} className="nav-link"
            onClick={() => navigate(`/parc/${p.id}`)}
            style={{ background: route.parkId === p.id ? C.accent : "transparent", color: route.parkId === p.id ? C.header : "#aab4cc", border: "none", padding: "5px 14px", borderRadius: 20, cursor: "pointer", fontFamily: "'Passion One', cursive", fontSize: 15, fontWeight: 400 }}>
            {p.logo ? <img src={p.logo} alt={p.name} style={{ height: 24, objectFit: "contain", verticalAlign: "middle", marginRight: 4 }} /> : p.emoji} {p.name}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ============================================================
// HOME PAGE
// ============================================================
function HomePage({ data }) {
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* HERO */}
      <div style={{ background: C.header, padding: "80px 24px 60px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 50%, rgba(232,197,71,0.1) 0%, transparent 60%)" }} />
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: data.profile.photo ? "1fr 1fr" : "1fr", gap: 48, alignItems: "center", position: "relative", zIndex: 1 }}>
          <div>
            <div style={{ display: "inline-block", background: C.accent, color: C.header, fontFamily: "'Passion One', cursive", fontSize: 13, letterSpacing: 3, padding: "4px 16px", borderRadius: 20, marginBottom: 20 }}>BLOG PARCS D'ATTRACTIONS</div>
            <h1 style={{ fontSize: "clamp(52px, 8vw, 90px)", color: "#fff", lineHeight: 0.95, letterSpacing: 2, marginBottom: 24 }}>
              BIENVENUE<br />SUR MON<br /><span style={{ color: C.accent }}>BLOG !</span>
            </h1>
            <p style={{ color: "#aab4cc", fontSize: 16, lineHeight: 1.7, maxWidth: 480, marginBottom: 32, fontFamily: "'Nunito', sans-serif" }}>{data.profile.bio}</p>
            <button className="btn-primary" onClick={() => data.parks[0] && navigate(`/parc/${data.parks[0].id}`)}>Découvrir les parcs →</button>
          </div>
          {data.profile.photo && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 300, height: 300, borderRadius: "50%", overflow: "hidden", border: `4px solid ${C.accent}`, boxShadow: `0 0 0 8px rgba(232,197,71,0.15)` }}>
                <img src={data.profile.photo} alt="Sami" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BLOCS HOME */}
      {data.homeBlocks && data.homeBlocks.length > 0 && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 0" }}>
          <BlockRenderer blocks={data.homeBlocks} />
        </div>
      )}

      {/* PARCS */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 40 }}>
          <h2 style={{ fontSize: 48, color: C.header }}>PARCS VISITÉS</h2>
          <span style={{ color: C.muted, fontSize: 13, fontFamily: "'Nunito', sans-serif" }}>{data.parks.length} parc(s)</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          {data.parks.map(p => (
            <div key={p.id} className="park-card" onClick={() => navigate(`/parc/${p.id}`)}
              style={{ background: C.card, borderRadius: 20, overflow: "hidden", border: "2px solid rgba(5,10,48,0.1)", boxShadow: "0 4px 16px rgba(5,10,48,0.07)" }}>
              <div style={{ height: 160, background: `linear-gradient(135deg, ${p.coverColor} 0%, ${p.coverColor}cc 100%)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                {p.heroImage ? <img src={p.heroImage} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                  : p.logo ? <img src={p.logo} alt={p.name} style={{ height: 80, objectFit: "contain", position: "relative", zIndex: 1 }} />
                  : <span style={{ fontSize: 72, position: "relative", zIndex: 1 }}>{p.emoji}</span>}
                <div style={{ position: "absolute", bottom: 10, right: 14, fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "'Nunito', sans-serif", fontWeight: 700, letterSpacing: 2 }}>{p.visited}</div>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ fontSize: 11, color: "#e8a500", letterSpacing: 3, textTransform: "uppercase", marginBottom: 6, fontFamily: "'Nunito', sans-serif", fontWeight: 800 }}>{p.country}</div>
                <h3 style={{ fontSize: 28, color: C.header, marginBottom: 12 }}>{p.name}</h3>
                <div style={{ display: "flex", gap: 16 }}>
                  <span style={{ color: C.muted, fontSize: 13, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>🎢 {p.attractions.length} attraction(s)</span>
                  <span style={{ color: C.muted, fontSize: 13, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>🛍️ {p.shop?.products.length || 0} produit(s)</span>
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
function ParkPage({ park, tab }) {
  const tabs = [["attractions", "🎢 Attractions"], ["boutique", "🛍️ Boutique"]];
  return (
    <div style={{ minHeight: "100vh" }}>
      {/* HERO */}
      <div style={{ background: park.coverColor, padding: "60px 24px 0", position: "relative", overflow: "hidden" }}>
        {park.heroImage && <img src={park.heroImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.25 }} />}
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1, paddingBottom: 40 }}>
          {park.logo
            ? <img src={park.logo} alt={park.name} style={{ height: 80, objectFit: "contain", marginBottom: 16 }} />
            : <div style={{ fontSize: 64, marginBottom: 8 }}>{park.emoji}</div>}
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: 4, fontFamily: "'Nunito', sans-serif", fontWeight: 700, textTransform: "uppercase" }}>{park.country} · {park.visited}</div>
          <h1 style={{ fontSize: "clamp(40px,7vw,72px)", color: "#fff", letterSpacing: 3, marginTop: 8 }}>{park.name}</h1>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, position: "relative", zIndex: 1 }}>
          {tabs.map(([t, label]) => (
            <button key={t} className="tab-btn" onClick={() => navigate(`/parc/${park.id}/${t}`)}
              style={{ background: tab === t ? C.accent : "rgba(255,255,255,0.1)", color: tab === t ? C.header : "rgba(255,255,255,0.8)", border: "none", padding: "12px 24px", borderRadius: "12px 12px 0 0", cursor: "pointer", fontFamily: "'Passion One', cursive", fontSize: 16 }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px" }}>
        {/* BLOCS DU PARC */}
        {park.blocks && park.blocks.length > 0 && tab === "attractions" && (
          <div style={{ marginBottom: 48 }}>
            <BlockRenderer blocks={park.blocks} />
          </div>
        )}
        {tab === "attractions" && <AttractionsTab park={park} />}
        {tab === "boutique" && <ShopTab park={park} />}
      </div>
    </div>
  );
}

// ============================================================
// ATTRACTIONS TAB
// ============================================================
function AttractionsTab({ park }) {
  return (
    <div>
      {park.globalTip && (
        <div style={{ background: C.header, borderRadius: 16, padding: "20px 24px", marginBottom: 40, display: "flex", gap: 16, alignItems: "flex-start" }}>
          <span style={{ fontSize: 24 }}>💡</span>
          <div>
            <div style={{ fontSize: 11, color: C.accent, letterSpacing: 3, fontFamily: "'Nunito', sans-serif", fontWeight: 800, marginBottom: 6 }}>MON CONSEIL GLOBAL</div>
            <p style={{ color: "#e8e0d0", lineHeight: 1.7, fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}>{park.globalTip}</p>
          </div>
        </div>
      )}
      <h2 style={{ fontSize: 40, color: C.header, marginBottom: 28 }}>ATTRACTIONS ({park.attractions.length})</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {park.attractions.map(attr => (
          <div key={attr.id} className="attr-card" onClick={() => navigate(`/parc/${park.id}/attraction/${attr.id}`)}
            style={{ background: C.card, borderRadius: 16, overflow: "hidden", border: "2px solid rgba(5,10,48,0.08)" }}>
            <div style={{ height: 180, background: `linear-gradient(135deg, ${park.coverColor}22, ${park.coverColor}44)`, position: "relative", overflow: "hidden" }}>
              {attr.photos.length > 0
                ? <img src={attr.photos[0].url} alt={attr.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, opacity: 0.4 }}>🎢</div>}
              {attr.fastpass && <div style={{ position: "absolute", top: 10, right: 10, background: C.accent, color: C.header, fontSize: 10, fontFamily: "'Passion One', cursive", padding: "3px 10px", borderRadius: 20, letterSpacing: 1 }}>FASTPASS</div>}
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 10, color: C.muted, fontFamily: "'Nunito', sans-serif", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>{attr.type}</div>
              <h3 style={{ fontSize: 22, color: C.header, marginBottom: 8 }}>{attr.name}</h3>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <ThrillStars level={attr.thrill} />
                <span style={{ fontSize: 12, color: C.muted, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>{attr.waitAvg || "—"}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {attr.tags.slice(0, 2).map(t => <span key={t} style={{ fontSize: 10, color: C.header, background: `${C.bg}`, padding: "2px 10px", borderRadius: 20, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>{t}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// SHOP TAB
// ============================================================
function ShopTab({ park }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const shop = park.shop;
  if (!shop) return <div style={{ padding: 60, textAlign: "center", color: C.muted }}>Boutique non disponible.</div>;
  if (selectedProduct) return <ProductDetail product={selectedProduct} onBack={() => setSelectedProduct(null)} parkColor={park.coverColor} />;
  const filtered = activeCategory === "all" ? shop.products : shop.products.filter(p => p.categoryId === activeCategory);
  return (
    <div>
      <h2 style={{ fontSize: 40, color: C.header, marginBottom: 8 }}>🛍️ BOUTIQUE</h2>
      <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontWeight: 700, marginBottom: 32 }}>{shop.products.length} produit(s)</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
        <button onClick={() => setActiveCategory("all")} className="btn-primary" style={{ background: activeCategory === "all" ? C.accent : "rgba(5,10,48,0.1)", color: C.header, fontSize: 13 }}>Tout ({shop.products.length})</button>
        {shop.categories.map(cat => {
          const count = shop.products.filter(p => p.categoryId === cat.id).length;
          if (count === 0) return null;
          return <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className="btn-primary" style={{ background: activeCategory === cat.id ? C.accent : "rgba(5,10,48,0.1)", color: C.header, fontSize: 13 }}>{cat.emoji} {cat.name} ({count})</button>;
        })}
      </div>
      {filtered.length > 0
        ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {filtered.map(p => <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />)}
          </div>
        : <div style={{ textAlign: "center", padding: 60, color: C.muted, fontFamily: "'Nunito', sans-serif" }}>Aucun produit dans cette catégorie.</div>}
    </div>
  );
}

function ProductCard({ product, onClick }) {
  return (
    <div onClick={onClick} className="product-card" style={{ background: C.card, borderRadius: 16, overflow: "hidden", border: "2px solid rgba(5,10,48,0.08)" }}>
      <div style={{ height: 200, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {product.photos.length > 0 ? <img src={product.photos[0].url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 48, opacity: 0.3 }}>🛍️</span>}
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {product.topSale && <span style={{ background: "#ef4444", color: "#fff", fontSize: 10, fontFamily: "'Passion One', cursive", padding: "3px 10px", borderRadius: 20 }}>🔥 TOP</span>}
          {product.heartPick && <span style={{ background: "#ec4899", color: "#fff", fontSize: 10, fontFamily: "'Passion One', cursive", padding: "3px 10px", borderRadius: 20 }}>💖</span>}
        </div>
      </div>
      <div style={{ padding: 16 }}>
        <p style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>{product.boutiques || "Toutes boutiques"}</p>
        <h3 style={{ fontSize: 20, color: C.header, marginBottom: 8 }}>{product.name}</h3>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
          {product.availableSizes.map(s => <span key={s} style={{ fontSize: 10, color: C.muted, border: "1px solid rgba(5,10,48,0.2)", padding: "2px 7px", borderRadius: 4, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>{s}</span>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "'Passion One', cursive", fontSize: 24, color: "#e8a500" }}>{product.price.toFixed(2)} €</span>
          {product.discountEligible && !product.noDiscount && <span style={{ fontSize: 11, color: "#16a34a", background: "#dcfce7", padding: "2px 8px", borderRadius: 10, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>Remises dispo</span>}
        </div>
      </div>
    </div>
  );
}

function ProductDetail({ product, onBack, parkColor }) {
  const [activePhoto, setActivePhoto] = useState(0);
  return (
    <div>
      <button onClick={onBack} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 24 }}>← Retour à la boutique</button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
        <div>
          <div style={{ borderRadius: 16, overflow: "hidden", aspectRatio: "4/3", background: C.bg, marginBottom: 10 }}>
            {product.photos.length > 0 ? <img src={product.photos[activePhoto]?.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80, opacity: 0.2 }}>🛍️</div>}
          </div>
          {product.photos.length > 1 && (
            <div style={{ display: "flex", gap: 8 }}>
              {product.photos.map((p, i) => <div key={i} onClick={() => setActivePhoto(i)} style={{ width: 64, height: 64, borderRadius: 8, overflow: "hidden", cursor: "pointer", border: `2px solid ${i === activePhoto ? C.accent : "transparent"}` }}><img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>)}
            </div>
          )}
        </div>
        <div>
          <h1 style={{ fontSize: 40, color: C.header, marginBottom: 8 }}>{product.name}</h1>
          {product.boutiques && <p style={{ color: C.muted, fontSize: 13, marginBottom: 16, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>📍 {product.isExclusivity ? "Exclusivité — " : ""}{product.boutiques}</p>}
          <p style={{ color: C.text, lineHeight: 1.7, marginBottom: 24, fontFamily: "'Nunito', sans-serif" }}>{product.description}</p>
          <div style={{ background: C.bg, borderRadius: 14, padding: 20, border: "2px solid rgba(5,10,48,0.1)", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12 }}>
              <span style={{ fontFamily: "'Passion One', cursive", fontSize: 36, color: "#e8a500" }}>{product.price.toFixed(2)} €</span>
              <span style={{ fontSize: 13, color: C.muted, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>Prix public</span>
            </div>
            {product.discountEligible && !product.noDiscount && (
              <div>
                <div style={{ fontSize: 11, color: C.muted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>PRIX AVEC VOTRE PASS</div>
                <div style={{ display: "grid", gap: 8 }}>
                  {DISCOUNTS.map(d => (
                    <div key={d.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", borderRadius: 8, padding: "10px 14px", border: `1px solid ${d.color}44` }}>
                      <div><span style={{ fontSize: 13, color: d.color, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>{d.label}</span><span style={{ fontSize: 11, color: C.muted, marginLeft: 8, fontFamily: "'Nunito', sans-serif" }}>-{d.pct}%</span></div>
                      <span style={{ fontFamily: "'Passion One', cursive", fontSize: 22, color: d.color }}>{discountedPrice(product.price, d.pct)} €</span>
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
// ATTRACTION PAGE
// ============================================================
function AttractionPage({ attraction, park, onBack }) {
  if (!attraction || !park) return null;
  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ background: park.coverColor, padding: "60px 24px 48px", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 13, fontWeight: 700, padding: "6px 16px", borderRadius: 20, marginBottom: 20 }}>← {park.name}</button>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", letterSpacing: 3, fontFamily: "'Nunito', sans-serif", fontWeight: 700, textTransform: "uppercase", marginBottom: 8 }}>{attraction.type}</div>
          <h1 style={{ fontSize: "clamp(44px, 7vw, 76px)", color: "#fff", letterSpacing: 3, lineHeight: 0.95, marginBottom: 20 }}>{attraction.name}</h1>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 3, fontFamily: "'Nunito', sans-serif", fontWeight: 700, marginBottom: 4 }}>SENSATIONS</div><ThrillStars level={attraction.thrill} /></div>
            {attraction.minHeight && <div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 3, fontFamily: "'Nunito', sans-serif", fontWeight: 700, marginBottom: 4 }}>TAILLE MIN.</div><span style={{ color: C.accent, fontFamily: "'Passion One', cursive", fontSize: 18 }}>{attraction.minHeight} cm</span></div>}
            <div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 3, fontFamily: "'Nunito', sans-serif", fontWeight: 700, marginBottom: 4 }}>DURÉE</div><span style={{ color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>{attraction.duration || "—"}</span></div>
            <div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 3, fontFamily: "'Nunito', sans-serif", fontWeight: 700, marginBottom: 4 }}>ATTENTE MOY.</div><span style={{ color: "#fff", fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>{attraction.waitAvg || "—"}</span></div>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 36 }}>
          {attraction.tags.map(t => <span key={t} style={{ fontSize: 12, color: C.header, background: C.bg, padding: "4px 14px", borderRadius: 20, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>{t}</span>)}
        </div>
        {attraction.bio ? (
          <div style={{ background: C.card, borderRadius: 16, padding: 32, marginBottom: 32, border: "2px solid rgba(5,10,48,0.08)" }}>
            <div style={{ fontSize: 11, color: "#e8a500", letterSpacing: 3, fontFamily: "'Nunito', sans-serif", fontWeight: 800, marginBottom: 16 }}>✨ PRÉSENTATION</div>
            <p style={{ color: C.text, fontSize: 17, lineHeight: 1.8, marginBottom: 16, fontStyle: "italic", fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}>{attraction.bio.intro}</p>
            <p style={{ color: C.muted, lineHeight: 1.7, marginBottom: 16, fontFamily: "'Nunito', sans-serif" }}>{attraction.bio.experience}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
              <div style={{ background: C.bg, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, fontFamily: "'Nunito', sans-serif", fontWeight: 800, marginBottom: 8 }}>IDÉAL POUR</div>
                <p style={{ color: C.text, fontSize: 14, lineHeight: 1.6, fontFamily: "'Nunito', sans-serif" }}>{attraction.bio.bestFor}</p>
              </div>
              <div style={{ background: "#fffbea", borderRadius: 10, padding: 16, border: "1px solid #fde68a" }}>
                <div style={{ fontSize: 10, color: "#e8a500", letterSpacing: 2, fontFamily: "'Nunito', sans-serif", fontWeight: 800, marginBottom: 8 }}>LE SAVIEZ-VOUS ?</div>
                <p style={{ color: C.text, fontSize: 14, lineHeight: 1.6, fontFamily: "'Nunito', sans-serif" }}>{attraction.bio.funFact}</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: C.card, border: "2px dashed rgba(5,10,48,0.15)", borderRadius: 14, padding: 32, textAlign: "center", marginBottom: 32 }}>
            <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontWeight: 700 }}>Bio non encore générée</p>
          </div>
        )}
        {attraction.tip && (
          <div style={{ borderLeft: `4px solid ${C.accent}`, paddingLeft: 24, marginBottom: 32 }}>
            <div style={{ fontSize: 10, color: "#e8a500", letterSpacing: 3, fontFamily: "'Nunito', sans-serif", fontWeight: 800, marginBottom: 8 }}>💡 MON CONSEIL</div>
            <p style={{ color: C.text, lineHeight: 1.7, fontSize: 15, fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}>{attraction.tip}</p>
          </div>
        )}
        {/* Blocs de l'attraction */}
        {attraction.blocks && attraction.blocks.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <BlockRenderer blocks={attraction.blocks} />
          </div>
        )}
        {attraction.photos.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 3, fontFamily: "'Nunito', sans-serif", fontWeight: 800, marginBottom: 16 }}>📷 PHOTOS</div>
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
// APP PRINCIPALE
// ============================================================
export default function ParkBlog() {
  const [data, setData] = useState(INITIAL_DATA);
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    fetch(API_URL)
      .then(r => r.json())
      .then(d => { if (d && d.parks && d.parks.length > 0) setData(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const park = route.parkId ? data.parks.find(p => p.id === route.parkId) : null;
  const attraction = park && route.attractionId ? park.attractions.find(a => a.id === route.attractionId) : null;

  return (
    <>
      <style>{CSS}</style>
      <Nav route={route} data={data} />
      <main>
        {route.view === "home" && <HomePage data={data} />}
        {route.view === "park" && park && <ParkPage park={park} tab={route.tab || "attractions"} />}
        {route.view === "attraction" && attraction && park && <AttractionPage attraction={attraction} park={park} onBack={() => navigate(`/parc/${park.id}`)} />}
      </main>
    </>
  );
}
