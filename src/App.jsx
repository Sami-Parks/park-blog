import { useState, useRef, useCallback } from "react";

// ============================================================
// DONNÉES INITIALES
// ============================================================
const INITIAL_DATA = {
  parks: [
    {
      id: "disneyland-paris",
      name: "Disneyland Paris",
      emoji: "🏰",
      country: "France",
      coverColor: "#1a1a2e",
      accentColor: "#e8c547",
      visited: "2023",
      globalTip: "Arrivez 30 min avant l'ouverture. Les premières heures sont magiques.",
      heroImage: null,
      attractions: [
        {
          id: "space-mountain",
          name: "Space Mountain",
          type: "Montagne russe",
          thrill: 5,
          minHeight: 120,
          fastpass: true,
          singleRider: false,
          duration: "3 min",
          waitAvg: "60 min",
          tip: "La meilleure attraction du parc. Prenez le FastPass dès l'ouverture.",
          bio: null,
          photos: [],
          tags: ["Sensations fortes", "Must-do", "Dans le noir"],
        },
        {
          id: "pirates-des-caraibes",
          name: "Pirates des Caraïbes",
          type: "Bateau",
          thrill: 2,
          minHeight: null,
          fastpass: false,
          singleRider: false,
          duration: "15 min",
          waitAvg: "25 min",
          tip: "Idéal en milieu de journée quand les files sont longues ailleurs.",
          bio: null,
          photos: [],
          tags: ["Famille", "Emblématique", "Intérieur"],
        },
      ],
    },
  ],
};

// ============================================================
// COMPOSANT AI BIO GENERATOR
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
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Tu es un expert des parcs d'attractions. Rédige une fiche de présentation captivante pour l'attraction "${attraction.name}" du parc "${parkName}". 
              
              Informations disponibles:
              - Type: ${attraction.type}
              - Durée: ${attraction.duration}
              - Niveau sensations (1-5): ${attraction.thrill}
              - Taille minimale: ${attraction.minHeight ? attraction.minHeight + "cm" : "Aucune"}
              - Tags: ${attraction.tags.join(", ")}
              - Conseil personnel: ${attraction.tip}
              
              Réponds en JSON avec exactement ce format (sans markdown, juste le JSON brut):
              {
                "intro": "2-3 phrases d'accroche immersives et enthousiastes",
                "experience": "Description de l'expérience vécue en 2-3 phrases",
                "bestFor": "Pour qui est-ce idéal ? (1-2 phrases)",
                "funFact": "Un fait amusant ou peu connu sur cette attraction"
              }`,
            },
          ],
        }),
      });
      const data = await res.json();
      const text = data.content.map((b) => b.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const bio = JSON.parse(clean);
      onBioGenerated(bio);
    } catch (e) {
      onBioGenerated({
        intro: "Une attraction incontournable qui vous promet une expérience inoubliable.",
        experience: "Préparez-vous à vivre des sensations uniques dans un décor soigné.",
        bestFor: "Idéal pour toute la famille cherchant des émotions fortes.",
        funFact: "Cette attraction accueille des millions de visiteurs chaque année.",
      });
    }
    setLoading(false);
  };

  return (
    <button
      onClick={generate}
      disabled={loading}
      style={{
        background: loading ? "#333" : "linear-gradient(135deg, #f5a623, #e8c547)",
        color: loading ? "#888" : "#000",
        border: "none",
        padding: "10px 20px",
        borderRadius: "6px",
        cursor: loading ? "not-allowed" : "pointer",
        fontWeight: "700",
        fontSize: "13px",
        fontFamily: "inherit",
        letterSpacing: "0.5px",
        transition: "all 0.2s",
      }}
    >
      {loading ? "⚡ Génération en cours..." : "✨ Générer la bio avec l'IA"}
    </button>
  );
}

// ============================================================
// COMPOSANT AI PHOTO LAYOUT
// ============================================================
function AIPhotoLayout({ photos, attractionName }) {
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateLayout = async () => {
    if (photos.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: `J'ai ${photos.length} photos de l'attraction "${attractionName}". Propose un layout CSS Grid créatif pour les afficher. 
              Réponds uniquement en JSON (sans markdown):
              {
                "gridTemplate": "CSS grid-template-areas value",
                "suggestion": "Description du layout en 1 phrase"
              }
              Avec ${photos.length} zones nommées photo1, photo2, etc.
              Exemple pour 3 photos: "gridTemplate": "'photo1 photo1' 'photo2 photo3'"`,
            },
          ],
        }),
      });
      const data = await res.json();
      const text = data.content.map((b) => b.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      setLayout(JSON.parse(clean));
    } catch (e) {
      setLayout({ gridTemplate: null, suggestion: "Layout automatique" });
    }
    setLoading(false);
  };

  if (photos.length === 0) return null;

  const gridStyle = layout?.gridTemplate
    ? { display: "grid", gridTemplateAreas: layout.gridTemplate, gap: "8px" }
    : { display: "grid", gridTemplateColumns: `repeat(${Math.min(photos.length, 3)}, 1fr)`, gap: "8px" };

  return (
    <div style={{ marginTop: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <span style={{ color: "#888", fontSize: "13px" }}>
          {layout ? `✓ ${layout.suggestion}` : `${photos.length} photo(s)`}
        </span>
        <button
          onClick={generateLayout}
          disabled={loading}
          style={{
            background: "transparent",
            border: "1px solid #f5a623",
            color: "#f5a623",
            padding: "5px 12px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontFamily: "inherit",
          }}
        >
          {loading ? "..." : "🎨 Layout IA"}
        </button>
      </div>
      <div style={gridStyle}>
        {photos.map((photo, i) => (
          <div
            key={i}
            style={{
              gridArea: layout?.gridTemplate ? `photo${i + 1}` : undefined,
              borderRadius: "8px",
              overflow: "hidden",
              aspectRatio: "16/9",
              background: "#1a1a1a",
            }}
          >
            <img
              src={photo.url}
              alt={photo.caption || `Photo ${i + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// COMPOSANT ÉTOILES
// ============================================================
function ThrillStars({ level }) {
  return (
    <span>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < level ? "#f5a623" : "#333", fontSize: "14px" }}>
          ★
        </span>
      ))}
    </span>
  );
}

// ============================================================
// APP PRINCIPALE
// ============================================================
export default function ParkBlog() {
  const [data, setData] = useState(INITIAL_DATA);
  const [mode, setMode] = useState("visitor"); // visitor | admin
  const [view, setView] = useState("home"); // home | park | attraction | admin-home | admin-park | admin-attraction
  const [selectedPark, setSelectedPark] = useState(null);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [showAddPark, setShowAddPark] = useState(false);
  const [showAddAttraction, setShowAddAttraction] = useState(false);
  const fileInputRef = useRef(null);
  const [newPark, setNewPark] = useState({ name: "", country: "", emoji: "🎢", visited: new Date().getFullYear().toString(), globalTip: "" });
  const [newAttraction, setNewAttraction] = useState({ name: "", type: "", thrill: 3, minHeight: "", fastpass: false, singleRider: false, duration: "", waitAvg: "", tip: "", tags: "" });

  const updateData = useCallback((updater) => setData((d) => ({ ...d, ...updater(d) })), []);

  const getPark = (id) => data.parks.find((p) => p.id === id);
  const getAttraction = (parkId, attrId) => getPark(parkId)?.attractions.find((a) => a.id === attrId);

  const handleBioGenerated = (parkId, attrId, bio) => {
    setData((d) => ({
      ...d,
      parks: d.parks.map((p) =>
        p.id === parkId
          ? { ...p, attractions: p.attractions.map((a) => (a.id === attrId ? { ...a, bio } : a)) }
          : p
      ),
    }));
  };

  const handlePhotoUpload = (parkId, attrId, files) => {
    const readers = Array.from(files).map(
      (file) =>
        new Promise((res) => {
          const r = new FileReader();
          r.onload = (e) => res({ url: e.target.result, caption: file.name.replace(/\.[^.]+$/, "") });
          r.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((newPhotos) => {
      setData((d) => ({
        ...d,
        parks: d.parks.map((p) =>
          p.id === parkId
            ? {
                ...p,
                attractions: p.attractions.map((a) =>
                  a.id === attrId ? { ...a, photos: [...a.photos, ...newPhotos] } : a
                ),
              }
            : p
        ),
      }));
    });
  };

  const addPark = () => {
    if (!newPark.name) return;
    const id = newPark.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setData((d) => ({ ...d, parks: [...d.parks, { ...newPark, id, coverColor: "#1a1a2e", accentColor: "#e8c547", heroImage: null, attractions: [] }] }));
    setNewPark({ name: "", country: "", emoji: "🎢", visited: new Date().getFullYear().toString(), globalTip: "" });
    setShowAddPark(false);
  };

  const addAttraction = (parkId) => {
    if (!newAttraction.name) return;
    const id = newAttraction.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const attr = {
      ...newAttraction,
      id,
      minHeight: newAttraction.minHeight ? parseInt(newAttraction.minHeight) : null,
      thrill: parseInt(newAttraction.thrill),
      tags: newAttraction.tags.split(",").map((t) => t.trim()).filter(Boolean),
      bio: null,
      photos: [],
    };
    setData((d) => ({ ...d, parks: d.parks.map((p) => (p.id === parkId ? { ...p, attractions: [...p.attractions, attr] } : p)) }));
    setNewAttraction({ name: "", type: "", thrill: 3, minHeight: "", fastpass: false, singleRider: false, duration: "", waitAvg: "", tip: "", tags: "" });
    setShowAddAttraction(false);
  };

  // ---- STYLES ----
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,600;1,300&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0d0d0d; color: #e8e0d0; font-family: 'DM Sans', sans-serif; }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
  `;

  const park = selectedPark ? getPark(selectedPark) : null;
  const attraction = selectedPark && selectedAttraction ? getAttraction(selectedPark, selectedAttraction) : null;

  // ============================================================
  // RENDU VUE VISITEUR - ACCUEIL
  // ============================================================
  const renderHome = () => (
    <div style={{ minHeight: "100vh", background: "#0d0d0d" }}>
      {/* HERO */}
      <div style={{
        height: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        background: "radial-gradient(ellipse at 50% 0%, #1a1040 0%, #0d0d0d 70%)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 20% 50%, rgba(248,165,36,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(120,80,200,0.08) 0%, transparent 40%)",
        }} />
        <div style={{ position: "relative", textAlign: "center", padding: "0 24px" }}>
          <div style={{ fontSize: "13px", letterSpacing: "6px", color: "#f5a623", marginBottom: "24px", textTransform: "uppercase" }}>
            Journal de voyage
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: "clamp(60px, 12vw, 120px)", lineHeight: 0.9, color: "#fff", letterSpacing: "2px" }}>
            PARCS &<br />
            <span style={{ color: "#f5a623" }}>SENSATIONS</span>
          </h1>
          <p style={{ marginTop: "32px", color: "#888", fontSize: "16px", maxWidth: "480px", lineHeight: 1.7, fontWeight: 300 }}>
            Mon carnet de bord personnel — toutes les attractions, conseils et secrets que j'ai accumulés au fil de mes visites.
          </p>
        </div>
      </div>

      {/* GRILLE DES PARCS */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "42px", color: "#fff", letterSpacing: "2px" }}>PARCS VISITÉS</h2>
          <span style={{ color: "#555", fontSize: "13px" }}>{data.parks.length} parc(s)</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
          {data.parks.map((p) => (
            <div
              key={p.id}
              onClick={() => { setSelectedPark(p.id); setView("park"); }}
              style={{
                background: "#111", borderRadius: "16px", overflow: "hidden", cursor: "pointer",
                border: "1px solid #1e1e1e", transition: "all 0.3s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.borderColor = "#f5a623"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "#1e1e1e"; }}
            >
              <div style={{
                height: "180px", background: `linear-gradient(135deg, ${p.coverColor}, ${p.coverColor}99)`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "72px",
                position: "relative",
              }}>
                {p.emoji}
                <div style={{ position: "absolute", bottom: "12px", right: "16px", fontSize: "11px", color: "rgba(255,255,255,0.4)", letterSpacing: "2px" }}>
                  {p.visited}
                </div>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ fontSize: "11px", color: "#f5a623", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "8px" }}>{p.country}</div>
                <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: "28px", color: "#fff", letterSpacing: "1px" }}>{p.name}</h3>
                <p style={{ color: "#666", fontSize: "13px", marginTop: "8px", lineHeight: 1.5 }}>{p.attractions.length} attraction(s)</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================================
  // VUE PARC
  // ============================================================
  const renderPark = () => {
    if (!park) return null;
    return (
      <div style={{ minHeight: "100vh", background: "#0d0d0d" }}>
        <div style={{
          height: "400px", background: `linear-gradient(135deg, ${park.coverColor} 0%, #0d0d0d 100%)`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <div style={{ fontSize: "80px", marginBottom: "16px" }}>{park.emoji}</div>
          <div style={{ fontSize: "11px", color: park.accentColor, letterSpacing: "5px", textTransform: "uppercase" }}>{park.country} · {park.visited}</div>
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: "64px", color: "#fff", letterSpacing: "3px", marginTop: "8px" }}>{park.name}</h1>
        </div>

        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "60px 24px" }}>
          {park.globalTip && (
            <div style={{ background: "#111", border: "1px solid #f5a623", borderRadius: "12px", padding: "24px", marginBottom: "48px" }}>
              <div style={{ fontSize: "11px", color: "#f5a623", letterSpacing: "3px", marginBottom: "8px" }}>💡 MON CONSEIL GLOBAL</div>
              <p style={{ color: "#e0d8cc", lineHeight: 1.7 }}>{park.globalTip}</p>
            </div>
          )}

          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "36px", color: "#fff", marginBottom: "32px", letterSpacing: "2px" }}>
            ATTRACTIONS ({park.attractions.length})
          </h2>

          <div style={{ display: "grid", gap: "16px" }}>
            {park.attractions.map((attr) => (
              <div
                key={attr.id}
                onClick={() => { setSelectedAttraction(attr.id); setView("attraction"); }}
                style={{
                  background: "#111", borderRadius: "12px", padding: "24px", cursor: "pointer",
                  border: "1px solid #1e1e1e", transition: "all 0.2s",
                  display: "grid", gridTemplateColumns: "1fr auto", gap: "16px", alignItems: "center",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f5a623"; e.currentTarget.style.background = "#141414"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.background = "#111"; }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: "22px", color: "#fff", letterSpacing: "1px" }}>{attr.name}</h3>
                    {attr.fastpass && <span style={{ background: "#f5a623", color: "#000", fontSize: "10px", padding: "2px 8px", borderRadius: "3px", fontWeight: "700" }}>FASTPASS</span>}
                  </div>
                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    {attr.tags.slice(0, 3).map((t) => (
                      <span key={t} style={{ fontSize: "11px", color: "#666", border: "1px solid #2a2a2a", padding: "2px 10px", borderRadius: "20px" }}>{t}</span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <ThrillStars level={attr.thrill} />
                  <div style={{ color: "#555", fontSize: "12px", marginTop: "4px" }}>{attr.waitAvg || "—"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // VUE ATTRACTION
  // ============================================================
  const renderAttraction = () => {
    if (!attraction || !park) return null;
    return (
      <div style={{ minHeight: "100vh", background: "#0d0d0d" }}>
        <div style={{
          background: `linear-gradient(135deg, ${park.coverColor}99 0%, #0d0d0d 100%)`,
          padding: "80px 24px 60px",
          borderBottom: "1px solid #1a1a1a",
        }}>
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <div style={{ fontSize: "11px", color: "#f5a623", letterSpacing: "3px", marginBottom: "16px" }}>
              {park.emoji} {park.name} › {attraction.type}
            </div>
            <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: "clamp(48px, 8vw, 80px)", color: "#fff", letterSpacing: "2px", lineHeight: 0.95 }}>
              {attraction.name}
            </h1>
            <div style={{ display: "flex", gap: "32px", marginTop: "24px", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "4px" }}>SENSATIONS</div>
                <ThrillStars level={attraction.thrill} />
              </div>
              {attraction.minHeight && (
                <div>
                  <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "4px" }}>TAILLE MIN.</div>
                  <span style={{ color: "#e8c547", fontWeight: "600" }}>{attraction.minHeight} cm</span>
                </div>
              )}
              <div>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "4px" }}>DURÉE</div>
                <span style={{ color: "#e0d8cc" }}>{attraction.duration || "—"}</span>
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "4px" }}>ATTENTE MOY.</div>
                <span style={{ color: "#e0d8cc" }}>{attraction.waitAvg || "—"}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
              {attraction.fastpass && (
                <span style={{ background: "#f5a623", color: "#000", fontSize: "11px", padding: "5px 14px", borderRadius: "4px", fontWeight: "700" }}>
                  ⚡ FASTPASS DISPONIBLE
                </span>
              )}
              {attraction.singleRider && (
                <span style={{ background: "#2a2a2a", color: "#aaa", fontSize: "11px", padding: "5px 14px", borderRadius: "4px" }}>
                  👤 SINGLE RIDER
                </span>
              )}
              {!attraction.minHeight && (
                <span style={{ background: "#1a2a1a", color: "#6ab06a", fontSize: "11px", padding: "5px 14px", borderRadius: "4px" }}>
                  👨‍👩‍👧 TOUT PUBLIC
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 24px" }}>
          {/* TAGS */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "40px" }}>
            {attraction.tags.map((t) => (
              <span key={t} style={{ fontSize: "12px", color: "#888", border: "1px solid #2a2a2a", padding: "4px 14px", borderRadius: "20px" }}>{t}</span>
            ))}
          </div>

          {/* BIO IA */}
          {attraction.bio ? (
            <div style={{ background: "#111", borderRadius: "16px", padding: "32px", marginBottom: "40px", border: "1px solid #1e1e1e" }}>
              <div style={{ fontSize: "11px", color: "#f5a623", letterSpacing: "3px", marginBottom: "20px" }}>✨ PRÉSENTATION</div>
              <p style={{ color: "#e0d8cc", fontSize: "17px", lineHeight: 1.8, marginBottom: "20px", fontStyle: "italic" }}>{attraction.bio.intro}</p>
              <p style={{ color: "#aaa", lineHeight: 1.7, marginBottom: "16px" }}>{attraction.bio.experience}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "24px" }}>
                <div style={{ background: "#0d0d0d", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "8px" }}>IDÉAL POUR</div>
                  <p style={{ color: "#aaa", fontSize: "14px", lineHeight: 1.6 }}>{attraction.bio.bestFor}</p>
                </div>
                <div style={{ background: "#0d0d0d", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ fontSize: "10px", color: "#f5a623", letterSpacing: "2px", marginBottom: "8px" }}>LE SAVIEZ-VOUS ?</div>
                  <p style={{ color: "#aaa", fontSize: "14px", lineHeight: 1.6 }}>{attraction.bio.funFact}</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: "#0d0d0d", border: "1px dashed #2a2a2a", borderRadius: "12px", padding: "32px", textAlign: "center", marginBottom: "40px" }}>
              <p style={{ color: "#444", fontSize: "14px" }}>Bio non encore générée</p>
            </div>
          )}

          {/* MON CONSEIL */}
          {attraction.tip && (
            <div style={{ borderLeft: "3px solid #f5a623", paddingLeft: "24px", marginBottom: "40px" }}>
              <div style={{ fontSize: "10px", color: "#f5a623", letterSpacing: "3px", marginBottom: "8px" }}>💡 MON CONSEIL</div>
              <p style={{ color: "#e0d8cc", lineHeight: 1.7, fontSize: "15px" }}>{attraction.tip}</p>
            </div>
          )}

          {/* PHOTOS */}
          {attraction.photos.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", color: "#555", letterSpacing: "3px", marginBottom: "16px" }}>📷 PHOTOS</div>
              <AIPhotoLayout photos={attraction.photos} attractionName={attraction.name} />
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // ADMIN - COMPOSANT INPUT
  // ============================================================
  const AdminInput = ({ label, value, onChange, type = "text", placeholder }) => (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "11px", color: "#888", letterSpacing: "2px", marginBottom: "6px", textTransform: "uppercase" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px",
          padding: "10px 14px", color: "#e8e0d0", fontSize: "14px", fontFamily: "inherit", outline: "none",
        }}
      />
    </div>
  );

  // ============================================================
  // ADMIN - VUE PARC
  // ============================================================
  const renderAdminPark = () => {
    if (!park) return null;
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "42px", color: "#fff", letterSpacing: "2px", marginBottom: "32px" }}>
          {park.emoji} {park.name} — Admin
        </h2>

        {/* LISTE ATTRACTIONS */}
        <div style={{ marginBottom: "32px" }}>
          {park.attractions.map((attr) => (
            <div key={attr.id} style={{ background: "#111", borderRadius: "12px", padding: "20px", marginBottom: "12px", border: "1px solid #1e1e1e" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: "22px", color: "#fff", letterSpacing: "1px", marginBottom: "8px" }}>{attr.name}</h3>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {attr.bio && <span style={{ fontSize: "11px", color: "#4a8", background: "#1a2a1a", padding: "2px 8px", borderRadius: "4px" }}>✓ Bio</span>}
                    {attr.photos.length > 0 && <span style={{ fontSize: "11px", color: "#48a", background: "#1a1a2a", padding: "2px 8px", borderRadius: "4px" }}>{attr.photos.length} photo(s)</span>}
                    {!attr.bio && <span style={{ fontSize: "11px", color: "#888", background: "#1a1a1a", padding: "2px 8px", borderRadius: "4px" }}>Pas de bio</span>}
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedAttraction(attr.id); setView("admin-attraction"); }}
                  style={{ background: "#f5a623", color: "#000", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontSize: "12px", fontFamily: "inherit" }}
                >
                  ÉDITER
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* AJOUTER ATTRACTION */}
        <button
          onClick={() => setShowAddAttraction(!showAddAttraction)}
          style={{ background: "#1a1a1a", border: "1px dashed #f5a623", color: "#f5a623", padding: "14px 24px", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontSize: "14px", width: "100%" }}
        >
          + Ajouter une attraction
        </button>

        {showAddAttraction && (
          <div style={{ background: "#111", borderRadius: "12px", padding: "24px", marginTop: "16px", border: "1px solid #2a2a2a" }}>
            <AdminInput label="Nom" value={newAttraction.name} onChange={(v) => setNewAttraction(p => ({ ...p, name: v }))} />
            <AdminInput label="Type" value={newAttraction.type} placeholder="ex: Montagne russe, Bateau..." onChange={(v) => setNewAttraction(p => ({ ...p, type: v }))} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <AdminInput label="Durée" value={newAttraction.duration} placeholder="ex: 3 min" onChange={(v) => setNewAttraction(p => ({ ...p, duration: v }))} />
              <AdminInput label="Attente moyenne" value={newAttraction.waitAvg} placeholder="ex: 45 min" onChange={(v) => setNewAttraction(p => ({ ...p, waitAvg: v }))} />
              <AdminInput label="Taille min (cm)" type="number" value={newAttraction.minHeight} onChange={(v) => setNewAttraction(p => ({ ...p, minHeight: v }))} />
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "#888", letterSpacing: "2px", marginBottom: "6px" }}>SENSATIONS (1-5)</label>
                <input type="range" min="1" max="5" value={newAttraction.thrill} onChange={(e) => setNewAttraction(p => ({ ...p, thrill: e.target.value }))}
                  style={{ width: "100%" }} />
                <span style={{ color: "#f5a623" }}>{newAttraction.thrill}/5</span>
              </div>
            </div>
            <AdminInput label="Tags (séparés par virgule)" value={newAttraction.tags} placeholder="ex: Famille, Must-do, Extérieur" onChange={(v) => setNewAttraction(p => ({ ...p, tags: v }))} />
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "#888", letterSpacing: "2px", marginBottom: "8px" }}>ACCÈS</label>
              <div style={{ display: "flex", gap: "16px" }}>
                {[["fastpass", "FastPass"], ["singleRider", "Single Rider"]].map(([key, label]) => (
                  <label key={key} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#aaa", fontSize: "14px" }}>
                    <input type="checkbox" checked={newAttraction[key]} onChange={(e) => setNewAttraction(p => ({ ...p, [key]: e.target.checked }))} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "11px", color: "#888", letterSpacing: "2px", display: "block", marginBottom: "6px" }}>MON CONSEIL</label>
              <textarea
                value={newAttraction.tip}
                onChange={(e) => setNewAttraction(p => ({ ...p, tip: e.target.value }))}
                rows={3}
                style={{ width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "10px 14px", color: "#e8e0d0", fontSize: "14px", fontFamily: "inherit", resize: "vertical" }}
              />
            </div>
            <button onClick={() => addAttraction(park.id)} style={{ background: "#f5a623", color: "#000", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontFamily: "inherit", fontSize: "14px" }}>
              AJOUTER L'ATTRACTION
            </button>
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // ADMIN - VUE ATTRACTION
  // ============================================================
  const renderAdminAttraction = () => {
    if (!attraction || !park) return null;
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "42px", color: "#fff", letterSpacing: "2px", marginBottom: "8px" }}>{attraction.name}</h2>
        <p style={{ color: "#555", marginBottom: "40px" }}>{park.name}</p>

        {/* GÉNÉRATION BIO */}
        <div style={{ background: "#111", borderRadius: "16px", padding: "28px", marginBottom: "24px", border: "1px solid #1e1e1e" }}>
          <div style={{ fontSize: "11px", color: "#888", letterSpacing: "3px", marginBottom: "16px" }}>✨ BIO GÉNÉRÉE PAR L'IA</div>
          {attraction.bio ? (
            <div style={{ marginBottom: "20px" }}>
              <p style={{ color: "#6ab06a", fontSize: "13px", marginBottom: "12px" }}>✓ Bio générée avec succès</p>
              <p style={{ color: "#888", fontSize: "13px", lineHeight: 1.6 }}>{attraction.bio.intro}</p>
            </div>
          ) : (
            <p style={{ color: "#555", fontSize: "13px", marginBottom: "16px" }}>Aucune bio générée pour l'instant.</p>
          )}
          <AIBioGenerator
            attraction={attraction}
            parkName={park.name}
            onBioGenerated={(bio) => handleBioGenerated(park.id, attraction.id, bio)}
          />
        </div>

        {/* UPLOAD PHOTOS */}
        <div style={{ background: "#111", borderRadius: "16px", padding: "28px", marginBottom: "24px", border: "1px solid #1e1e1e" }}>
          <div style={{ fontSize: "11px", color: "#888", letterSpacing: "3px", marginBottom: "16px" }}>📷 PHOTOS ({attraction.photos.length})</div>

          {attraction.photos.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "8px", marginBottom: "20px" }}>
              {attraction.photos.map((photo, i) => (
                <div key={i} style={{ borderRadius: "8px", overflow: "hidden", aspectRatio: "4/3", position: "relative", background: "#1a1a1a" }}>
                  <img src={photo.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    onClick={() => {
                      setData((d) => ({
                        ...d,
                        parks: d.parks.map((p) =>
                          p.id === park.id
                            ? { ...p, attractions: p.attractions.map((a) => a.id === attraction.id ? { ...a, photos: a.photos.filter((_, idx) => idx !== i) } : a) }
                            : p
                        ),
                      }));
                    }}
                    style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >×</button>
                </div>
              ))}
            </div>
          )}

          <div
            onClick={() => {
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "image/*";
              input.multiple = true;
              input.onchange = (e) => handlePhotoUpload(park.id, attraction.id, e.target.files);
              input.click();
            }}
            style={{
              border: "2px dashed #2a2a2a", borderRadius: "12px", padding: "32px", textAlign: "center", cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#f5a623"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = "#2a2a2a"}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>📸</div>
            <p style={{ color: "#555", fontSize: "14px" }}>Cliquez pour ajouter des photos</p>
            <p style={{ color: "#333", fontSize: "12px", marginTop: "4px" }}>JPG, PNG — plusieurs fichiers acceptés</p>
          </div>

          {attraction.photos.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <AIPhotoLayout photos={attraction.photos} attractionName={attraction.name} />
            </div>
          )}
        </div>

        {/* MODIFIER CONSEIL */}
        <div style={{ background: "#111", borderRadius: "16px", padding: "28px", border: "1px solid #1e1e1e" }}>
          <div style={{ fontSize: "11px", color: "#888", letterSpacing: "3px", marginBottom: "16px" }}>💡 MON CONSEIL</div>
          <textarea
            value={attraction.tip}
            onChange={(e) => {
              const val = e.target.value;
              setData((d) => ({
                ...d,
                parks: d.parks.map((p) =>
                  p.id === park.id
                    ? { ...p, attractions: p.attractions.map((a) => (a.id === attraction.id ? { ...a, tip: val } : a)) }
                    : p
                ),
              }));
            }}
            rows={4}
            placeholder="Partagez votre conseil personnel sur cette attraction..."
            style={{ width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "12px 16px", color: "#e8e0d0", fontSize: "14px", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6 }}
          />
        </div>
      </div>
    );
  };

  // ============================================================
  // ADMIN - ACCUEIL
  // ============================================================
  const renderAdminHome = () => (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
      <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "48px", color: "#fff", letterSpacing: "2px", marginBottom: "8px" }}>TABLEAU DE BORD</h2>
      <p style={{ color: "#555", marginBottom: "40px" }}>Gérez vos parcs et attractions</p>

      <div style={{ display: "grid", gap: "12px", marginBottom: "32px" }}>
        {data.parks.map((p) => (
          <div key={p.id} style={{ background: "#111", borderRadius: "12px", padding: "20px", border: "1px solid #1e1e1e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: "22px", color: "#fff", letterSpacing: "1px" }}>{p.emoji} {p.name}</h3>
              <p style={{ color: "#555", fontSize: "13px" }}>{p.attractions.length} attractions</p>
            </div>
            <button
              onClick={() => { setSelectedPark(p.id); setView("admin-park"); }}
              style={{ background: "#f5a623", color: "#000", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontSize: "12px", fontFamily: "inherit" }}
            >
              GÉRER
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowAddPark(!showAddPark)}
        style={{ background: "#1a1a1a", border: "1px dashed #f5a623", color: "#f5a623", padding: "14px 24px", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontSize: "14px", width: "100%", marginBottom: "16px" }}
      >
        + Ajouter un parc
      </button>

      {showAddPark && (
        <div style={{ background: "#111", borderRadius: "12px", padding: "24px", border: "1px solid #2a2a2a" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <AdminInput label="Nom du parc" value={newPark.name} onChange={(v) => setNewPark(p => ({ ...p, name: v }))} />
            <AdminInput label="Emoji" value={newPark.emoji} onChange={(v) => setNewPark(p => ({ ...p, emoji: v }))} />
            <AdminInput label="Pays" value={newPark.country} onChange={(v) => setNewPark(p => ({ ...p, country: v }))} />
            <AdminInput label="Année de visite" value={newPark.visited} onChange={(v) => setNewPark(p => ({ ...p, visited: v }))} />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "11px", color: "#888", letterSpacing: "2px", display: "block", marginBottom: "6px" }}>CONSEIL GLOBAL</label>
            <textarea
              value={newPark.globalTip}
              onChange={(e) => setNewPark(p => ({ ...p, globalTip: e.target.value }))}
              rows={2}
              style={{ width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "10px 14px", color: "#e8e0d0", fontSize: "14px", fontFamily: "inherit", resize: "vertical" }}
            />
          </div>
          <button onClick={addPark} style={{ background: "#f5a623", color: "#000", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontFamily: "inherit", fontSize: "14px" }}>
            CRÉER LE PARC
          </button>
        </div>
      )}
    </div>
  );

  // ============================================================
  // NAVIGATION
  // ============================================================
  const NavBreadcrumb = () => {
    const crumbs = [{ label: mode === "admin" ? "Admin" : "Accueil", onClick: () => setView(mode === "admin" ? "admin-home" : "home") }];
    if (park && ["park", "attraction", "admin-park", "admin-attraction"].includes(view)) {
      crumbs.push({ label: park.name, onClick: () => setView(mode === "admin" ? "admin-park" : "park") });
    }
    if (attraction && ["attraction", "admin-attraction"].includes(view)) {
      crumbs.push({ label: attraction.name, onClick: null });
    }
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#555" }}>
        {crumbs.map((c, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {i > 0 && <span>›</span>}
            <span
              onClick={c.onClick || undefined}
              style={{ cursor: c.onClick ? "pointer" : "default", color: c.onClick ? "#888" : "#e8e0d0", transition: "color 0.2s" }}
              onMouseEnter={(e) => c.onClick && (e.target.style.color = "#f5a623")}
              onMouseLeave={(e) => c.onClick && (e.target.style.color = "#888")}
            >
              {c.label}
            </span>
          </span>
        ))}
      </div>
    );
  };

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  if (!adminUnlocked && mode === "admin") {
    return (
      <>
        <style>{CSS}</style>
        <div style={{ minHeight: "100vh", background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#111", borderRadius: "16px", padding: "40px", border: "1px solid #1e1e1e", width: "360px" }}>
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "32px", color: "#fff", marginBottom: "8px", letterSpacing: "2px" }}>ACCÈS ADMIN</h2>
            <p style={{ color: "#555", fontSize: "13px", marginBottom: "24px" }}>Mot de passe : <span style={{ color: "#888" }}>admin</span></p>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && adminPassword === "admin" && setAdminUnlocked(true)}
              placeholder="Mot de passe..."
              style={{ width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "12px 16px", color: "#e8e0d0", fontSize: "14px", fontFamily: "inherit", marginBottom: "16px" }}
            />
            <button
              onClick={() => adminPassword === "admin" && setAdminUnlocked(true)}
              style={{ width: "100%", background: "#f5a623", color: "#000", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontFamily: "inherit", fontSize: "14px" }}
            >
              ENTRER
            </button>
            <button onClick={() => setMode("visitor")} style={{ width: "100%", background: "transparent", border: "none", color: "#555", cursor: "pointer", marginTop: "12px", fontFamily: "inherit", fontSize: "13px" }}>
              ← Retour au blog
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", background: "#0d0d0d" }}>
        {/* NAVBAR */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(13,13,13,0.95)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid #1a1a1a",
          padding: "0 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: "64px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <div
              onClick={() => { setView(mode === "admin" ? "admin-home" : "home"); setSelectedPark(null); setSelectedAttraction(null); }}
              style={{ fontFamily: "'Bebas Neue'", fontSize: "24px", color: "#fff", cursor: "pointer", letterSpacing: "3px" }}
            >
              PARCS & <span style={{ color: "#f5a623" }}>SENSATIONS</span>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {data.parks.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPark(p.id); setSelectedAttraction(null); setView(mode === "admin" ? "admin-park" : "park"); }}
                  style={{
                    background: selectedPark === p.id ? "#f5a623" : "transparent",
                    color: selectedPark === p.id ? "#000" : "#666",
                    border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer",
                    fontFamily: "inherit", fontSize: "13px", fontWeight: selectedPark === p.id ? "700" : "400",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => selectedPark !== p.id && (e.target.style.color = "#fff")}
                  onMouseLeave={(e) => selectedPark !== p.id && (e.target.style.color = "#666")}
                >
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <NavBreadcrumb />
            <button
              onClick={() => { setMode(mode === "admin" ? "visitor" : "admin"); setView(mode === "admin" ? "home" : "admin-home"); }}
              style={{
                background: mode === "admin" ? "#f5a623" : "transparent",
                color: mode === "admin" ? "#000" : "#555",
                border: "1px solid", borderColor: mode === "admin" ? "#f5a623" : "#2a2a2a",
                padding: "6px 14px", borderRadius: "6px", cursor: "pointer",
                fontFamily: "inherit", fontSize: "12px", fontWeight: "600",
              }}
            >
              {mode === "admin" ? "⚡ MODE ADMIN" : "Admin"}
            </button>
          </div>
        </nav>

        {/* CONTENU */}
        <main>
          {mode === "visitor" && view === "home" && renderHome()}
          {mode === "visitor" && view === "park" && renderPark()}
          {mode === "visitor" && view === "attraction" && renderAttraction()}
          {mode === "admin" && view === "admin-home" && renderAdminHome()}
          {mode === "admin" && view === "admin-park" && renderAdminPark()}
          {mode === "admin" && view === "admin-attraction" && renderAdminAttraction()}
        </main>
      </div>
    </>
  );
}
