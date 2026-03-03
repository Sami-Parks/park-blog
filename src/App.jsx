import { useState, useCallback } from "react";

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
          id: "space-mountain", name: "Space Mountain", type: "Montagne russe",
          thrill: 5, minHeight: 120, fastpass: true, singleRider: false,
          duration: "3 min", waitAvg: "60 min",
          tip: "La meilleure attraction du parc. Prenez le FastPass dès l'ouverture.",
          bio: null, photos: [], tags: ["Sensations fortes", "Must-do", "Dans le noir"],
        },
        {
          id: "pirates-des-caraibes", name: "Pirates des Caraïbes", type: "Bateau",
          thrill: 2, minHeight: null, fastpass: false, singleRider: false,
          duration: "15 min", waitAvg: "25 min",
          tip: "Idéal en milieu de journée quand les files sont longues ailleurs.",
          bio: null, photos: [], tags: ["Famille", "Emblématique", "Intérieur"],
        },
      ],
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
            id: "sweat-mickey-gris",
            name: "Sweat Mickey Classique",
            categoryId: "vetements-homme",
            description: "Sweat molletonné avec broderie Mickey Mouse sur la poitrine. Coupe décontractée, idéal pour les soirées fraîches au parc.",
            price: 59.99,
            photos: [],
            sizes: { adulte: ["XS","S","M","L","XL","XXL"], enfant: [] },
            availableSizes: ["XS","S","M","L","XL"],
            discountEligible: true,
            noDiscount: false,
            boutiques: "World of Disney, Disney Fashion",
            isExclusivity: false,
            topSale: true,
            heartPick: false,
            arrivalDate: "",
            limitedQty: false,
            limitedNote: "",
            tags: ["Mickey", "Sweat", "Broderie"],
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

// ============================================================
// HELPERS
// ============================================================
function discountedPrice(price, pct) {
  return (price * (1 - pct / 100)).toFixed(2);
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
      onBioGenerated({ intro: "Une attraction incontournable.", experience: "Des sensations uniques.", bestFor: "Toute la famille.", funFact: "Millions de visiteurs chaque année." });
    }
    setLoading(false);
  };
  return (
    <button onClick={generate} disabled={loading} style={{ background: loading ? "#333" : "linear-gradient(135deg, #f5a623, #e8c547)", color: loading ? "#888" : "#000", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "700", fontSize: "13px", fontFamily: "inherit" }}>
      {loading ? "⚡ Génération..." : "✨ Générer la bio avec l'IA"}
    </button>
  );
}

// ============================================================
// STARS
// ============================================================
function ThrillStars({ level }) {
  return <span>{Array.from({ length: 5 }, (_, i) => <span key={i} style={{ color: i < level ? "#f5a623" : "#333", fontSize: "14px" }}>★</span>)}</span>;
}

// ============================================================
// ADMIN INPUT
// ============================================================
function AdminInput({ label, value, onChange, type = "text", placeholder, rows }) {
  const style = { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "10px 14px", color: "#e8e0d0", fontSize: "14px", fontFamily: "inherit", outline: "none", resize: rows ? "vertical" : undefined };
  return (
    <div style={{ marginBottom: "16px" }}>
      <label style={{ display: "block", fontSize: "11px", color: "#888", letterSpacing: "2px", marginBottom: "6px", textTransform: "uppercase" }}>{label}</label>
      {rows ? <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} /> : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} />}
    </div>
  );
}

// ============================================================
// PRODUCT CARD (visiteur)
// ============================================================
function ProductCard({ product, onClick }) {
  return (
    <div onClick={onClick} style={{ background: "#111", borderRadius: "16px", overflow: "hidden", cursor: "pointer", border: "1px solid #1e1e1e", transition: "all 0.3s", position: "relative" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = "#f5a623"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "#1e1e1e"; }}
    >
      {/* BADGES */}
      <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", flexDirection: "column", gap: "4px", zIndex: 2 }}>
        {product.topSale && <span style={{ background: "#ef4444", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "4px", letterSpacing: "1px" }}>🔥 TOP VENTE</span>}
        {product.heartPick && <span style={{ background: "#ec4899", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "4px" }}>💖 COUP DE CŒUR</span>}
        {product.limitedQty && <span style={{ background: "#7c3aed", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "4px" }}>⚡ LIMITÉ</span>}
        {product.arrivalDate && <span style={{ background: "#0d9488", color: "#fff", fontSize: "10px", fontWeight: "700", padding: "3px 8px", borderRadius: "4px" }}>🆕 À partir du {product.arrivalDate}</span>}
      </div>
      {/* IMAGE */}
      <div style={{ height: "200px", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {product.photos.length > 0
          ? <img src={product.photos[0].url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: "48px", opacity: 0.3 }}>🛍️</span>}
      </div>
      {/* INFOS */}
      <div style={{ padding: "16px" }}>
        <p style={{ fontSize: "11px", color: "#888", marginBottom: "4px" }}>{product.boutiques || "Toutes boutiques"}</p>
        <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: "20px", color: "#fff", letterSpacing: "1px", marginBottom: "8px" }}>{product.name}</h3>
        {/* TAILLES */}
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "12px" }}>
          {product.availableSizes.map(s => <span key={s} style={{ fontSize: "10px", color: "#aaa", border: "1px solid #2a2a2a", padding: "2px 7px", borderRadius: "3px" }}>{s}</span>)}
        </div>
        {/* PRIX */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontFamily: "'Bebas Neue'", fontSize: "24px", color: "#f5a623" }}>{product.price.toFixed(2)} €</span>
          {product.discountEligible && !product.noDiscount && (
            <span style={{ fontSize: "11px", color: "#4a8", background: "#1a2a1a", padding: "2px 8px", borderRadius: "4px" }}>Remises dispo</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PRODUCT DETAIL (visiteur)
// ============================================================
function ProductDetail({ product, onBack, parkColor }) {
  const [activePhoto, setActivePhoto] = useState(0);
  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d" }}>
      <div style={{ background: `linear-gradient(135deg, ${parkColor}44 0%, #0d0d0d 100%)`, padding: "60px 24px 40px", borderBottom: "1px solid #1a1a1a" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <button onClick={onBack} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "6px" }}>
            ← Retour à la boutique
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" }}>
            {/* PHOTOS */}
            <div>
              <div style={{ borderRadius: "16px", overflow: "hidden", aspectRatio: "4/3", background: "#1a1a1a", marginBottom: "12px" }}>
                {product.photos.length > 0
                  ? <img src={product.photos[activePhoto]?.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "80px", opacity: 0.2 }}>🛍️</div>}
              </div>
              {product.photos.length > 1 && (
                <div style={{ display: "flex", gap: "8px" }}>
                  {product.photos.map((p, i) => (
                    <div key={i} onClick={() => setActivePhoto(i)} style={{ width: "64px", height: "64px", borderRadius: "8px", overflow: "hidden", cursor: "pointer", border: `2px solid ${i === activePhoto ? "#f5a623" : "transparent"}` }}>
                      <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* INFOS */}
            <div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                {product.topSale && <span style={{ background: "#ef4444", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "4px 12px", borderRadius: "4px" }}>🔥 TOP VENTE</span>}
                {product.heartPick && <span style={{ background: "#ec4899", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "4px 12px", borderRadius: "4px" }}>💖 COUP DE CŒUR</span>}
                {product.limitedQty && <span style={{ background: "#7c3aed", color: "#fff", fontSize: "11px", fontWeight: "700", padding: "4px 12px", borderRadius: "4px" }}>⚡ {product.limitedNote || "Quantité limitée"}</span>}
              </div>
              <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: "42px", color: "#fff", letterSpacing: "2px", lineHeight: 1, marginBottom: "12px" }}>{product.name}</h1>
              {product.arrivalDate && <p style={{ color: "#0d9488", fontSize: "13px", marginBottom: "8px" }}>🆕 Disponible à partir du {product.arrivalDate}</p>}
              {product.boutiques && <p style={{ color: "#888", fontSize: "13px", marginBottom: "16px" }}>📍 {product.isExclusivity ? "Exclusivité " : ""}{product.boutiques}</p>}
              <p style={{ color: "#aaa", lineHeight: 1.7, marginBottom: "24px" }}>{product.description}</p>

              {/* TAILLES */}
              {(product.sizes.adulte.length > 0 || product.sizes.enfant.length > 0) && (
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontSize: "11px", color: "#888", letterSpacing: "2px", marginBottom: "10px" }}>TAILLES DISPONIBLES</div>
                  {product.sizes.adulte.length > 0 && (
                    <div style={{ marginBottom: "8px" }}>
                      <span style={{ fontSize: "11px", color: "#555", marginRight: "8px" }}>Adulte :</span>
                      <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap" }}>
                        {product.sizes.adulte.map(s => {
                          const avail = product.availableSizes.includes(s);
                          return <span key={s} style={{ fontSize: "12px", color: avail ? "#e8e0d0" : "#333", border: `1px solid ${avail ? "#555" : "#222"}`, padding: "4px 10px", borderRadius: "4px", textDecoration: avail ? "none" : "line-through" }}>{s}</span>;
                        })}
                      </div>
                    </div>
                  )}
                  {product.sizes.enfant.length > 0 && (
                    <div>
                      <span style={{ fontSize: "11px", color: "#555", marginRight: "8px" }}>Enfant :</span>
                      <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap" }}>
                        {product.sizes.enfant.map(s => {
                          const avail = product.availableSizes.includes(s);
                          return <span key={s} style={{ fontSize: "12px", color: avail ? "#e8e0d0" : "#333", border: `1px solid ${avail ? "#555" : "#222"}`, padding: "4px 10px", borderRadius: "4px", textDecoration: avail ? "none" : "line-through" }}>{s}</span>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PRIX */}
              <div style={{ background: "#111", borderRadius: "12px", padding: "20px", border: "1px solid #1e1e1e" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "16px" }}>
                  <span style={{ fontFamily: "'Bebas Neue'", fontSize: "36px", color: "#f5a623" }}>{product.price.toFixed(2)} €</span>
                  <span style={{ fontSize: "13px", color: "#555" }}>Prix public</span>
                </div>
                {product.discountEligible && !product.noDiscount ? (
                  <div>
                    <div style={{ fontSize: "11px", color: "#888", letterSpacing: "2px", marginBottom: "10px" }}>PRIX AVEC VOTRE PASS</div>
                    <div style={{ display: "grid", gap: "8px" }}>
                      {DISCOUNTS.map(d => (
                        <div key={d.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d0d0d", borderRadius: "8px", padding: "10px 14px", border: `1px solid ${d.color}33` }}>
                          <div>
                            <span style={{ fontSize: "12px", color: d.color, fontWeight: "600" }}>{d.label}</span>
                            <span style={{ fontSize: "11px", color: "#555", marginLeft: "8px" }}>-{d.pct}%</span>
                          </div>
                          <span style={{ fontFamily: "'Bebas Neue'", fontSize: "22px", color: d.color }}>{discountedPrice(product.price, d.pct)} €</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : product.noDiscount ? (
                  <p style={{ fontSize: "12px", color: "#555", fontStyle: "italic" }}>⚠️ Ce produit ne bénéficie d'aucune remise pass/CM.</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SHOP PAGE (visiteur)
// ============================================================
function ShopPage({ park }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filterTag, setFilterTag] = useState(null);

  const shop = park.shop;
  if (!shop) return <div style={{ padding: "60px 24px", color: "#555", textAlign: "center" }}>Boutique non disponible pour ce parc.</div>;

  if (selectedProduct) {
    return <ProductDetail product={selectedProduct} onBack={() => setSelectedProduct(null)} parkColor={park.coverColor} />;
  }

  const heartProducts = shop.products.filter(p => p.heartPick);
  const topProducts = shop.products.filter(p => p.topSale);
  const newProducts = shop.products.filter(p => p.arrivalDate);

  const filtered = activeCategory === "all" ? shop.products : shop.products.filter(p => p.categoryId === activeCategory);

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d" }}>
      {/* HERO BOUTIQUE */}
      <div style={{ background: `linear-gradient(135deg, ${park.coverColor} 0%, #0d0d0d 100%)`, padding: "60px 24px 40px", textAlign: "center" }}>
        <div style={{ fontSize: "11px", color: park.accentColor, letterSpacing: "5px", textTransform: "uppercase", marginBottom: "12px" }}>Boutique officielle</div>
        <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: "clamp(48px, 8vw, 80px)", color: "#fff", letterSpacing: "3px" }}>{park.emoji} {park.name}</h1>
        <p style={{ color: "#888", marginTop: "12px", fontSize: "14px" }}>Guide shopping pour préparer votre budget — {shop.products.length} produit(s) référencé(s)</p>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 24px" }}>

        {/* COUPS DE CŒUR */}
        {heartProducts.length > 0 && (
          <div style={{ marginBottom: "56px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "32px", color: "#ec4899", letterSpacing: "2px" }}>💖 COUPS DE CŒUR</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
              {heartProducts.map(p => <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />)}
            </div>
          </div>
        )}

        {/* NOUVEAUTÉS */}
        {newProducts.length > 0 && (
          <div style={{ marginBottom: "56px" }}>
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "32px", color: "#0d9488", letterSpacing: "2px", marginBottom: "24px" }}>🆕 NOUVEAUTÉS</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
              {newProducts.map(p => <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />)}
            </div>
          </div>
        )}

        {/* CATÉGORIES */}
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "32px", color: "#fff", letterSpacing: "2px", marginBottom: "20px" }}>COLLECTIONS</h2>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => setActiveCategory("all")} style={{ background: activeCategory === "all" ? "#f5a623" : "#1a1a1a", color: activeCategory === "all" ? "#000" : "#888", border: "none", padding: "8px 18px", borderRadius: "20px", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: "600" }}>
              Tout voir ({shop.products.length})
            </button>
            {shop.categories.map(cat => {
              const count = shop.products.filter(p => p.categoryId === cat.id).length;
              if (count === 0) return null;
              return (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ background: activeCategory === cat.id ? "#f5a623" : "#1a1a1a", color: activeCategory === cat.id ? "#000" : "#888", border: "none", padding: "8px 18px", borderRadius: "20px", cursor: "pointer", fontFamily: "inherit", fontSize: "13px" }}>
                  {cat.emoji} {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* GRILLE PRODUITS */}
        {filtered.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
            {filtered.map(p => <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} />)}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px", color: "#555" }}>Aucun produit dans cette catégorie pour l'instant.</div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// ADMIN SHOP
// ============================================================
function AdminShop({ park, onUpdate }) {
  const [view, setView] = useState("home"); // home | add-product | edit-product | categories
  const [editProduct, setEditProduct] = useState(null);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("🏷️");

  const shop = park.shop || { categories: [], products: [] };

  const EMPTY_PRODUCT = {
    id: "", name: "", categoryId: shop.categories[0]?.id || "",
    description: "", price: "", photos: [],
    sizes: { adulte: [], enfant: [] },
    availableSizes: [],
    discountEligible: true, noDiscount: false,
    boutiques: "", isExclusivity: false,
    topSale: false, heartPick: false,
    arrivalDate: "", limitedQty: false, limitedNote: "",
    tags: [],
  };

  const [form, setForm] = useState(EMPTY_PRODUCT);
  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const openAdd = () => { setForm(EMPTY_PRODUCT); setEditProduct(null); setView("add-product"); };
  const openEdit = (p) => { setForm({ ...p }); setEditProduct(p.id); setView("add-product"); };

  const handlePhotoUpload = (files) => {
    const readers = Array.from(files).map(file => new Promise(res => {
      const r = new FileReader();
      r.onload = e => res({ url: e.target.result, caption: file.name });
      r.readAsDataURL(file);
    }));
    Promise.all(readers).then(newPhotos => setF("photos", [...form.photos, ...newPhotos]));
  };

  const toggleSize = (size) => {
    setForm(f => ({
      ...f,
      availableSizes: f.availableSizes.includes(size) ? f.availableSizes.filter(s => s !== size) : [...f.availableSizes, size],
    }));
  };

  const toggleSizeType = (type, size) => {
    setForm(f => {
      const current = f.sizes[type];
      const updated = current.includes(size) ? current.filter(s => s !== size) : [...current, size];
      return { ...f, sizes: { ...f.sizes, [type]: updated } };
    });
  };

  const saveProduct = () => {
    if (!form.name) return;
    const id = form.id || form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();
    const product = { ...form, id, price: parseFloat(form.price) || 0 };
    const products = editProduct
      ? shop.products.map(p => p.id === editProduct ? product : p)
      : [...shop.products, product];
    onUpdate({ ...shop, products });
    setView("home");
  };

  const deleteProduct = (id) => {
    onUpdate({ ...shop, products: shop.products.filter(p => p.id !== id) });
  };

  const addCategory = () => {
    if (!newCatName) return;
    const id = newCatName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    onUpdate({ ...shop, categories: [...shop.categories, { id, name: newCatName, emoji: newCatEmoji }] });
    setNewCatName(""); setNewCatEmoji("🏷️");
  };

  const deleteCategory = (id) => {
    onUpdate({ ...shop, categories: shop.categories.filter(c => c.id !== id) });
  };

  const S = { // styles réutilisables
    card: { background: "#111", borderRadius: "12px", padding: "20px", marginBottom: "12px", border: "1px solid #1e1e1e" },
    btn: (color = "#f5a623") => ({ background: color, color: color === "#f5a623" ? "#000" : "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontSize: "12px", fontFamily: "inherit" }),
    sectionTitle: { fontFamily: "'Bebas Neue'", fontSize: "22px", color: "#fff", letterSpacing: "1px", marginBottom: "16px" },
    checkbox: (active, color = "#f5a623") => ({ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", background: active ? color + "22" : "#1a1a1a", border: `1px solid ${active ? color : "#2a2a2a"}`, borderRadius: "6px", padding: "6px 12px", color: active ? color : "#888", fontSize: "13px", transition: "all 0.2s" }),
  };

  // VUE ADD/EDIT PRODUIT
  if (view === "add-product") {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <button onClick={() => setView("home")} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", fontFamily: "inherit", marginBottom: "24px" }}>← Retour</button>
        <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "42px", color: "#fff", letterSpacing: "2px", marginBottom: "32px" }}>
          {editProduct ? "✏️ MODIFIER LE PRODUIT" : "➕ NOUVEAU PRODUIT"}
        </h2>

        {/* INFOS DE BASE */}
        <div style={S.card}>
          <div style={S.sectionTitle}>📦 Informations générales</div>
          <AdminInput label="Nom du produit *" value={form.name} onChange={v => setF("name", v)} placeholder="ex: Sweat Mickey Classique" />
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "11px", color: "#888", letterSpacing: "2px", marginBottom: "6px" }}>CATÉGORIE</label>
            <select value={form.categoryId} onChange={e => setF("categoryId", e.target.value)} style={{ width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "10px 14px", color: "#e8e0d0", fontSize: "14px", fontFamily: "inherit" }}>
              {shop.categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <AdminInput label="Description" value={form.description} onChange={v => setF("description", v)} rows={3} placeholder="Description courte du produit..." />
          <AdminInput label="Prix (€) *" type="number" value={form.price} onChange={v => setF("price", v)} placeholder="ex: 59.99" />
        </div>

        {/* TAILLES */}
        <div style={S.card}>
          <div style={S.sectionTitle}>📏 Tailles</div>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", color: "#888", letterSpacing: "2px", marginBottom: "10px" }}>TAILLES ADULTE PROPOSÉES</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {SIZES_ADULTE.map(s => (
                <span key={s} onClick={() => toggleSizeType("adulte", s)} style={S.checkbox(form.sizes.adulte.includes(s))}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", color: "#888", letterSpacing: "2px", marginBottom: "10px" }}>TAILLES ENFANT PROPOSÉES</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {SIZES_ENFANT.map(s => (
                <span key={s} onClick={() => toggleSizeType("enfant", s)} style={S.checkbox(form.sizes.enfant.includes(s))}>{s}</span>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#888", letterSpacing: "2px", marginBottom: "10px" }}>TAILLES ACTUELLEMENT DISPONIBLES EN STOCK</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[...form.sizes.adulte, ...form.sizes.enfant].map(s => (
                <span key={s} onClick={() => toggleSize(s)} style={S.checkbox(form.availableSizes.includes(s), "#4a8")}>{s} {form.availableSizes.includes(s) ? "✓" : "✗"}</span>
              ))}
            </div>
            {[...form.sizes.adulte, ...form.sizes.enfant].length === 0 && <p style={{ color: "#555", fontSize: "13px" }}>Sélectionnez d'abord les tailles proposées ci-dessus.</p>}
          </div>
        </div>

        {/* REMISES */}
        <div style={S.card}>
          <div style={S.sectionTitle}>💰 Remises Pass & CM</div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
            <span onClick={() => { setF("discountEligible", true); setF("noDiscount", false); }} style={S.checkbox(form.discountEligible && !form.noDiscount, "#4a8")}>✅ Remises applicables</span>
            <span onClick={() => { setF("discountEligible", false); setF("noDiscount", true); }} style={S.checkbox(form.noDiscount, "#ef4444")}>🚫 Aucune remise</span>
          </div>
          {form.discountEligible && !form.noDiscount && (
            <div style={{ background: "#0d0d0d", borderRadius: "8px", padding: "16px" }}>
              {DISCOUNTS.map(d => (
                <div key={d.key} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1a1a1a" }}>
                  <span style={{ color: d.color, fontSize: "13px" }}>{d.label} (-{d.pct}%)</span>
                  <span style={{ color: d.color, fontWeight: "700" }}>{form.price ? discountedPrice(parseFloat(form.price), d.pct) + " €" : "—"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOUTIQUES */}
        <div style={S.card}>
          <div style={S.sectionTitle}>📍 Disponibilité en boutique</div>
          <AdminInput label="Boutiques concernées" value={form.boutiques} onChange={v => setF("boutiques", v)} placeholder="ex: World of Disney, Disney Fashion" />
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <span onClick={() => setF("isExclusivity", !form.isExclusivity)} style={S.checkbox(form.isExclusivity, "#7c3aed")}>⭐ Exclusivité boutique</span>
          </div>
        </div>

        {/* BADGES */}
        <div style={S.card}>
          <div style={S.sectionTitle}>🏷️ Badges & Mise en avant</div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
            <span onClick={() => setF("topSale", !form.topSale)} style={S.checkbox(form.topSale, "#ef4444")}>🔥 TOP VENTE</span>
            <span onClick={() => setF("heartPick", !form.heartPick)} style={S.checkbox(form.heartPick, "#ec4899")}>💖 COUP DE CŒUR</span>
          </div>
          <AdminInput label="Date d'arrivée en boutique" value={form.arrivalDate} onChange={v => setF("arrivalDate", v)} placeholder="ex: 09 Mars" />
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <span onClick={() => setF("limitedQty", !form.limitedQty)} style={S.checkbox(form.limitedQty, "#7c3aed")}>⚡ Quantité / Vente limitée</span>
            {form.limitedQty && <div style={{ flex: 1, minWidth: "200px" }}><AdminInput label="Précision" value={form.limitedNote} onChange={v => setF("limitedNote", v)} placeholder="ex: Édition limitée 500 ex." /></div>}
          </div>
        </div>

        {/* PHOTOS */}
        <div style={S.card}>
          <div style={S.sectionTitle}>📷 Photos ({form.photos.length})</div>
          {form.photos.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px", marginBottom: "16px" }}>
              {form.photos.map((p, i) => (
                <div key={i} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", aspectRatio: "1" }}>
                  <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={() => setF("photos", form.photos.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", fontSize: "12px" }}>×</button>
                </div>
              ))}
            </div>
          )}
          <div onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.multiple = true; i.onchange = e => handlePhotoUpload(e.target.files); i.click(); }}
            style={{ border: "2px dashed #2a2a2a", borderRadius: "12px", padding: "24px", textAlign: "center", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#f5a623"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a2a"}>
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>📸</div>
            <p style={{ color: "#555", fontSize: "13px" }}>Cliquez pour ajouter des photos</p>
          </div>
        </div>

        {/* SAVE */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={saveProduct} style={{ ...S.btn(), padding: "14px 32px", fontSize: "14px" }}>
            {editProduct ? "💾 ENREGISTRER" : "✅ AJOUTER LE PRODUIT"}
          </button>
          <button onClick={() => setView("home")} style={{ ...S.btn("#333"), padding: "14px 24px", fontSize: "14px" }}>Annuler</button>
        </div>
      </div>
    );
  }

  // VUE CATÉGORIES
  if (view === "categories") {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <button onClick={() => setView("home")} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", fontFamily: "inherit", marginBottom: "24px" }}>← Retour</button>
        <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "42px", color: "#fff", letterSpacing: "2px", marginBottom: "32px" }}>🗂️ GÉRER LES CATÉGORIES</h2>
        <div style={{ display: "grid", gap: "8px", marginBottom: "24px" }}>
          {shop.categories.map(c => (
            <div key={c.id} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ color: "#e8e0d0", fontSize: "15px" }}>{c.emoji} {c.name}</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <span style={{ color: "#555", fontSize: "12px" }}>{shop.products.filter(p => p.categoryId === c.id).length} produit(s)</span>
                <button onClick={() => deleteCategory(c.id)} style={{ background: "#2a1a1a", border: "none", color: "#ef4444", cursor: "pointer", borderRadius: "4px", padding: "4px 10px", fontSize: "12px", fontFamily: "inherit" }}>Supprimer</button>
              </div>
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={S.sectionTitle}>Nouvelle catégorie</div>
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "12px" }}>
            <AdminInput label="Emoji" value={newCatEmoji} onChange={setNewCatEmoji} />
            <AdminInput label="Nom" value={newCatName} onChange={setNewCatName} placeholder="ex: Soldes en cours" />
          </div>
          <button onClick={addCategory} style={S.btn()}>+ AJOUTER</button>
        </div>
      </div>
    );
  }

  // VUE HOME ADMIN SHOP
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
      <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "42px", color: "#fff", letterSpacing: "2px", marginBottom: "8px" }}>🛍️ BOUTIQUE — {park.name}</h2>
      <p style={{ color: "#555", marginBottom: "32px" }}>{shop.products.length} produit(s) · {shop.categories.length} catégorie(s)</p>

      <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
        <button onClick={openAdd} style={{ ...S.btn(), padding: "12px 24px" }}>+ NOUVEAU PRODUIT</button>
        <button onClick={() => setView("categories")} style={{ ...S.btn("#1a1a1a"), border: "1px solid #2a2a2a", padding: "12px 24px" }}>🗂️ CATÉGORIES</button>
      </div>

      {shop.products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", border: "1px dashed #2a2a2a", borderRadius: "12px", color: "#555" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🛍️</div>
          <p>Aucun produit pour l'instant</p>
          <button onClick={openAdd} style={{ ...S.btn(), marginTop: "16px", padding: "10px 20px" }}>+ Ajouter le premier produit</button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {shop.products.map(p => (
            <div key={p.id} style={{ ...S.card, display: "grid", gridTemplateColumns: "60px 1fr auto", gap: "16px", alignItems: "center" }}>
              <div style={{ width: "60px", height: "60px", borderRadius: "8px", overflow: "hidden", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {p.photos.length > 0 ? <img src={p.photos[0].url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "24px", opacity: 0.3 }}>🛍️</span>}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: "18px", color: "#fff", letterSpacing: "1px" }}>{p.name}</h3>
                  {p.topSale && <span style={{ fontSize: "10px", background: "#ef444422", color: "#ef4444", padding: "1px 6px", borderRadius: "3px" }}>🔥</span>}
                  {p.heartPick && <span style={{ fontSize: "10px", background: "#ec489922", color: "#ec4899", padding: "1px 6px", borderRadius: "3px" }}>💖</span>}
                  {p.limitedQty && <span style={{ fontSize: "10px", background: "#7c3aed22", color: "#7c3aed", padding: "1px 6px", borderRadius: "3px" }}>⚡</span>}
                </div>
                <p style={{ color: "#555", fontSize: "12px" }}>{shop.categories.find(c => c.id === p.categoryId)?.name || "—"} · {p.price.toFixed(2)} € · {p.photos.length} photo(s)</p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => openEdit(p)} style={S.btn()}>ÉDITER</button>
                <button onClick={() => deleteProduct(p.id)} style={{ ...S.btn("#2a1a1a"), color: "#ef4444" }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
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
  const [parkTab, setParkTab] = useState("attractions"); // attractions | shop
  const [adminPassword, setAdminPassword] = useState("");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [showAddPark, setShowAddPark] = useState(false);
  const [showAddAttraction, setShowAddAttraction] = useState(false);
  const [newPark, setNewPark] = useState({ name: "", country: "", emoji: "🎢", visited: new Date().getFullYear().toString(), globalTip: "" });
  const [newAttraction, setNewAttraction] = useState({ name: "", type: "", thrill: 3, minHeight: "", fastpass: false, singleRider: false, duration: "", waitAvg: "", tip: "", tags: "" });
  const [adminParkView, setAdminParkView] = useState("attractions"); // attractions | shop

  const getPark = (id) => data.parks.find(p => p.id === id);
  const getAttraction = (parkId, attrId) => getPark(parkId)?.attractions.find(a => a.id === attrId);

  const park = selectedPark ? getPark(selectedPark) : null;
  const attraction = selectedPark && selectedAttraction ? getAttraction(selectedPark, selectedAttraction) : null;

  const updateParkShop = useCallback((parkId, shop) => {
    setData(d => ({ ...d, parks: d.parks.map(p => p.id === parkId ? { ...p, shop } : p) }));
  }, []);

  const handleBioGenerated = (parkId, attrId, bio) => {
    setData(d => ({ ...d, parks: d.parks.map(p => p.id === parkId ? { ...p, attractions: p.attractions.map(a => a.id === attrId ? { ...a, bio } : a) } : p) }));
  };

  const handlePhotoUpload = (parkId, attrId, files) => {
    const readers = Array.from(files).map(file => new Promise(res => { const r = new FileReader(); r.onload = e => res({ url: e.target.result, caption: file.name }); r.readAsDataURL(file); }));
    Promise.all(readers).then(newPhotos => {
      setData(d => ({ ...d, parks: d.parks.map(p => p.id === parkId ? { ...p, attractions: p.attractions.map(a => a.id === attrId ? { ...a, photos: [...a.photos, ...newPhotos] } : a) } : p) }));
    });
  };

  const addPark = () => {
    if (!newPark.name) return;
    const id = newPark.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setData(d => ({ ...d, parks: [...d.parks, { ...newPark, id, coverColor: "#1a1a2e", accentColor: "#e8c547", heroImage: null, attractions: [], shop: { categories: [], products: [] } }] }));
    setNewPark({ name: "", country: "", emoji: "🎢", visited: new Date().getFullYear().toString(), globalTip: "" });
    setShowAddPark(false);
  };

  const addAttraction = (parkId) => {
    if (!newAttraction.name) return;
    const id = newAttraction.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const attr = { ...newAttraction, id, minHeight: newAttraction.minHeight ? parseInt(newAttraction.minHeight) : null, thrill: parseInt(newAttraction.thrill), tags: newAttraction.tags.split(",").map(t => t.trim()).filter(Boolean), bio: null, photos: [] };
    setData(d => ({ ...d, parks: d.parks.map(p => p.id === parkId ? { ...p, attractions: [...p.attractions, attr] } : p) }));
    setNewAttraction({ name: "", type: "", thrill: 3, minHeight: "", fastpass: false, singleRider: false, duration: "", waitAvg: "", tip: "", tags: "" });
    setShowAddAttraction(false);
  };

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;0,600;1,300&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0d0d0d; color: #e8e0d0; font-family: 'DM Sans', sans-serif; }
    ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
  `;

  // ---- VIEWS ----
  const renderHome = () => (
    <div style={{ minHeight: "100vh", background: "#0d0d0d" }}>
      <div style={{ height: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "radial-gradient(ellipse at 50% 0%, #1a1040 0%, #0d0d0d 70%)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 20% 50%, rgba(248,165,36,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(120,80,200,0.08) 0%, transparent 40%)" }} />
        <div style={{ position: "relative", textAlign: "center", padding: "0 24px" }}>
          <div style={{ fontSize: "13px", letterSpacing: "6px", color: "#f5a623", marginBottom: "24px", textTransform: "uppercase" }}>Journal de voyage</div>
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: "clamp(60px, 12vw, 120px)", lineHeight: 0.9, color: "#fff", letterSpacing: "2px" }}>PARCS &<br /><span style={{ color: "#f5a623" }}>SENSATIONS</span></h1>
          <p style={{ marginTop: "32px", color: "#888", fontSize: "16px", maxWidth: "480px", lineHeight: 1.7, fontWeight: 300 }}>Mon carnet de bord personnel — attractions, conseils et boutiques des parcs que j'ai visités.</p>
        </div>
      </div>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "80px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "48px" }}>
          <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "42px", color: "#fff", letterSpacing: "2px" }}>PARCS VISITÉS</h2>
          <span style={{ color: "#555", fontSize: "13px" }}>{data.parks.length} parc(s)</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "24px" }}>
          {data.parks.map(p => (
            <div key={p.id} onClick={() => { setSelectedPark(p.id); setParkTab("attractions"); setView("park"); }} style={{ background: "#111", borderRadius: "16px", overflow: "hidden", cursor: "pointer", border: "1px solid #1e1e1e", transition: "all 0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.borderColor = "#f5a623"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "#1e1e1e"; }}>
              <div style={{ height: "180px", background: `linear-gradient(135deg, ${p.coverColor}, ${p.coverColor}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "72px", position: "relative" }}>
                {p.emoji}
                <div style={{ position: "absolute", bottom: "12px", right: "16px", fontSize: "11px", color: "rgba(255,255,255,0.4)", letterSpacing: "2px" }}>{p.visited}</div>
              </div>
              <div style={{ padding: "24px" }}>
                <div style={{ fontSize: "11px", color: "#f5a623", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "8px" }}>{p.country}</div>
                <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: "28px", color: "#fff", letterSpacing: "1px" }}>{p.name}</h3>
                <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                  <span style={{ color: "#666", fontSize: "13px" }}>{p.attractions.length} attraction(s)</span>
                  <span style={{ color: "#666", fontSize: "13px" }}>🛍️ {p.shop?.products.length || 0} produit(s)</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPark = () => {
    if (!park) return null;
    return (
      <div style={{ minHeight: "100vh", background: "#0d0d0d" }}>
        <div style={{ height: "340px", background: `linear-gradient(135deg, ${park.coverColor} 0%, #0d0d0d 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
          <div style={{ fontSize: "70px", marginBottom: "12px" }}>{park.emoji}</div>
          <div style={{ fontSize: "11px", color: park.accentColor, letterSpacing: "5px", textTransform: "uppercase" }}>{park.country} · {park.visited}</div>
          <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: "56px", color: "#fff", letterSpacing: "3px", marginTop: "8px" }}>{park.name}</h1>
        </div>
        {/* ONGLETS */}
        <div style={{ background: "#111", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "center", gap: "4px", padding: "0 24px" }}>
          {[["attractions", "🎢 Attractions"], ["shop", "🛍️ Boutique"]].map(([tab, label]) => (
            <button key={tab} onClick={() => setParkTab(tab)} style={{ background: "transparent", border: "none", borderBottom: parkTab === tab ? "3px solid #f5a623" : "3px solid transparent", color: parkTab === tab ? "#f5a623" : "#666", padding: "16px 24px", cursor: "pointer", fontFamily: "inherit", fontSize: "14px", fontWeight: parkTab === tab ? "600" : "400", transition: "all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>

        {parkTab === "attractions" && (
          <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "60px 24px" }}>
            {park.globalTip && (
              <div style={{ background: "#111", border: "1px solid #f5a623", borderRadius: "12px", padding: "24px", marginBottom: "48px" }}>
                <div style={{ fontSize: "11px", color: "#f5a623", letterSpacing: "3px", marginBottom: "8px" }}>💡 MON CONSEIL GLOBAL</div>
                <p style={{ color: "#e0d8cc", lineHeight: 1.7 }}>{park.globalTip}</p>
              </div>
            )}
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "36px", color: "#fff", marginBottom: "32px", letterSpacing: "2px" }}>ATTRACTIONS ({park.attractions.length})</h2>
            <div style={{ display: "grid", gap: "16px" }}>
              {park.attractions.map(attr => (
                <div key={attr.id} onClick={() => { setSelectedAttraction(attr.id); setView("attraction"); }} style={{ background: "#111", borderRadius: "12px", padding: "24px", cursor: "pointer", border: "1px solid #1e1e1e", transition: "all 0.2s", display: "grid", gridTemplateColumns: "1fr auto", gap: "16px", alignItems: "center" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#f5a623"; e.currentTarget.style.background = "#141414"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; e.currentTarget.style.background = "#111"; }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: "22px", color: "#fff", letterSpacing: "1px" }}>{attr.name}</h3>
                      {attr.fastpass && <span style={{ background: "#f5a623", color: "#000", fontSize: "10px", padding: "2px 8px", borderRadius: "3px", fontWeight: "700" }}>FASTPASS</span>}
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {attr.tags.slice(0, 3).map(t => <span key={t} style={{ fontSize: "11px", color: "#666", border: "1px solid #2a2a2a", padding: "2px 10px", borderRadius: "20px" }}>{t}</span>)}
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
        )}
        {parkTab === "shop" && <ShopPage park={park} />}
      </div>
    );
  };

  const renderAttraction = () => {
    if (!attraction || !park) return null;
    return (
      <div style={{ minHeight: "100vh", background: "#0d0d0d" }}>
        <div style={{ background: `linear-gradient(135deg, ${park.coverColor}99 0%, #0d0d0d 100%)`, padding: "80px 24px 60px", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <button onClick={() => setView("park")} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", marginBottom: "20px" }}>← {park.name}</button>
            <div style={{ fontSize: "11px", color: "#f5a623", letterSpacing: "3px", marginBottom: "12px" }}>{attraction.type}</div>
            <h1 style={{ fontFamily: "'Bebas Neue'", fontSize: "clamp(48px, 8vw, 80px)", color: "#fff", letterSpacing: "2px", lineHeight: 0.95 }}>{attraction.name}</h1>
            <div style={{ display: "flex", gap: "32px", marginTop: "24px", flexWrap: "wrap" }}>
              <div><div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "4px" }}>SENSATIONS</div><ThrillStars level={attraction.thrill} /></div>
              {attraction.minHeight && <div><div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "4px" }}>TAILLE MIN.</div><span style={{ color: "#e8c547", fontWeight: "600" }}>{attraction.minHeight} cm</span></div>}
              <div><div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "4px" }}>DURÉE</div><span style={{ color: "#e0d8cc" }}>{attraction.duration || "—"}</span></div>
              <div><div style={{ fontSize: "10px", color: "#555", letterSpacing: "2px", marginBottom: "4px" }}>ATTENTE MOY.</div><span style={{ color: "#e0d8cc" }}>{attraction.waitAvg || "—"}</span></div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
              {attraction.fastpass && <span style={{ background: "#f5a623", color: "#000", fontSize: "11px", padding: "5px 14px", borderRadius: "4px", fontWeight: "700" }}>⚡ FASTPASS DISPONIBLE</span>}
              {attraction.singleRider && <span style={{ background: "#2a2a2a", color: "#aaa", fontSize: "11px", padding: "5px 14px", borderRadius: "4px" }}>👤 SINGLE RIDER</span>}
              {!attraction.minHeight && <span style={{ background: "#1a2a1a", color: "#6ab06a", fontSize: "11px", padding: "5px 14px", borderRadius: "4px" }}>👨‍👩‍👧 TOUT PUBLIC</span>}
            </div>
          </div>
        </div>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 24px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "40px" }}>
            {attraction.tags.map(t => <span key={t} style={{ fontSize: "12px", color: "#888", border: "1px solid #2a2a2a", padding: "4px 14px", borderRadius: "20px" }}>{t}</span>)}
          </div>
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
          ) : <div style={{ background: "#0d0d0d", border: "1px dashed #2a2a2a", borderRadius: "12px", padding: "32px", textAlign: "center", marginBottom: "40px" }}><p style={{ color: "#444" }}>Bio non encore générée</p></div>}
          {attraction.tip && (
            <div style={{ borderLeft: "3px solid #f5a623", paddingLeft: "24px", marginBottom: "40px" }}>
              <div style={{ fontSize: "10px", color: "#f5a623", letterSpacing: "3px", marginBottom: "8px" }}>💡 MON CONSEIL</div>
              <p style={{ color: "#e0d8cc", lineHeight: 1.7, fontSize: "15px" }}>{attraction.tip}</p>
            </div>
          )}
          {attraction.photos.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", color: "#555", letterSpacing: "3px", marginBottom: "16px" }}>📷 PHOTOS</div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(attraction.photos.length, 3)}, 1fr)`, gap: "8px" }}>
                {attraction.photos.map((photo, i) => <div key={i} style={{ borderRadius: "8px", overflow: "hidden", aspectRatio: "16/9" }}><img src={photo.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>)}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAdminHome = () => (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
      <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "48px", color: "#fff", letterSpacing: "2px", marginBottom: "8px" }}>TABLEAU DE BORD</h2>
      <p style={{ color: "#555", marginBottom: "40px" }}>Gérez vos parcs, attractions et boutiques</p>
      <div style={{ display: "grid", gap: "12px", marginBottom: "32px" }}>
        {data.parks.map(p => (
          <div key={p.id} style={{ background: "#111", borderRadius: "12px", padding: "20px", border: "1px solid #1e1e1e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: "22px", color: "#fff", letterSpacing: "1px" }}>{p.emoji} {p.name}</h3>
              <p style={{ color: "#555", fontSize: "13px" }}>{p.attractions.length} attractions · {p.shop?.products.length || 0} produits boutique</p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => { setSelectedPark(p.id); setAdminParkView("attractions"); setView("admin-park"); }} style={{ background: "#f5a623", color: "#000", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontSize: "12px", fontFamily: "inherit" }}>ATTRACTIONS</button>
              <button onClick={() => { setSelectedPark(p.id); setAdminParkView("shop"); setView("admin-park"); }} style={{ background: "#1a1a1a", color: "#f5a623", border: "1px solid #f5a623", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontSize: "12px", fontFamily: "inherit" }}>🛍️ BOUTIQUE</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => setShowAddPark(!showAddPark)} style={{ background: "#1a1a1a", border: "1px dashed #f5a623", color: "#f5a623", padding: "14px 24px", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontSize: "14px", width: "100%", marginBottom: "16px" }}>+ Ajouter un parc</button>
      {showAddPark && (
        <div style={{ background: "#111", borderRadius: "12px", padding: "24px", border: "1px solid #2a2a2a" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <AdminInput label="Nom du parc" value={newPark.name} onChange={v => setNewPark(p => ({ ...p, name: v }))} />
            <AdminInput label="Emoji" value={newPark.emoji} onChange={v => setNewPark(p => ({ ...p, emoji: v }))} />
            <AdminInput label="Pays" value={newPark.country} onChange={v => setNewPark(p => ({ ...p, country: v }))} />
            <AdminInput label="Année de visite" value={newPark.visited} onChange={v => setNewPark(p => ({ ...p, visited: v }))} />
          </div>
          <AdminInput label="Conseil global" value={newPark.globalTip} onChange={v => setNewPark(p => ({ ...p, globalTip: v }))} rows={2} />
          <button onClick={addPark} style={{ background: "#f5a623", color: "#000", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontFamily: "inherit", fontSize: "14px" }}>CRÉER LE PARC</button>
        </div>
      )}
    </div>
  );

  const renderAdminPark = () => {
    if (!park) return null;
    return (
      <div>
        <div style={{ background: "#111", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "center", gap: "4px", padding: "0 24px" }}>
          {[["attractions", "🎢 Attractions"], ["shop", "🛍️ Boutique"]].map(([tab, label]) => (
            <button key={tab} onClick={() => setAdminParkView(tab)} style={{ background: "transparent", border: "none", borderBottom: adminParkView === tab ? "3px solid #f5a623" : "3px solid transparent", color: adminParkView === tab ? "#f5a623" : "#666", padding: "16px 24px", cursor: "pointer", fontFamily: "inherit", fontSize: "14px", fontWeight: adminParkView === tab ? "600" : "400" }}>
              {label}
            </button>
          ))}
        </div>
        {adminParkView === "attractions" && (
          <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "42px", color: "#fff", letterSpacing: "2px", marginBottom: "32px" }}>{park.emoji} {park.name} — Attractions</h2>
            <div style={{ marginBottom: "32px" }}>
              {park.attractions.map(attr => (
                <div key={attr.id} style={{ background: "#111", borderRadius: "12px", padding: "20px", marginBottom: "12px", border: "1px solid #1e1e1e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ fontFamily: "'Bebas Neue'", fontSize: "20px", color: "#fff", letterSpacing: "1px", marginBottom: "6px" }}>{attr.name}</h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {attr.bio && <span style={{ fontSize: "11px", color: "#4a8", background: "#1a2a1a", padding: "2px 8px", borderRadius: "4px" }}>✓ Bio</span>}
                      {attr.photos.length > 0 && <span style={{ fontSize: "11px", color: "#48a", background: "#1a1a2a", padding: "2px 8px", borderRadius: "4px" }}>{attr.photos.length} photo(s)</span>}
                    </div>
                  </div>
                  <button onClick={() => { setSelectedAttraction(attr.id); setView("admin-attraction"); }} style={{ background: "#f5a623", color: "#000", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "700", fontSize: "12px", fontFamily: "inherit" }}>ÉDITER</button>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAddAttraction(!showAddAttraction)} style={{ background: "#1a1a1a", border: "1px dashed #f5a623", color: "#f5a623", padding: "14px 24px", borderRadius: "8px", cursor: "pointer", fontFamily: "inherit", fontSize: "14px", width: "100%" }}>+ Ajouter une attraction</button>
            {showAddAttraction && (
              <div style={{ background: "#111", borderRadius: "12px", padding: "24px", marginTop: "16px", border: "1px solid #2a2a2a" }}>
                <AdminInput label="Nom" value={newAttraction.name} onChange={v => setNewAttraction(p => ({ ...p, name: v }))} />
                <AdminInput label="Type" value={newAttraction.type} placeholder="ex: Montagne russe" onChange={v => setNewAttraction(p => ({ ...p, type: v }))} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <AdminInput label="Durée" value={newAttraction.duration} onChange={v => setNewAttraction(p => ({ ...p, duration: v }))} />
                  <AdminInput label="Attente moyenne" value={newAttraction.waitAvg} onChange={v => setNewAttraction(p => ({ ...p, waitAvg: v }))} />
                  <AdminInput label="Taille min (cm)" type="number" value={newAttraction.minHeight} onChange={v => setNewAttraction(p => ({ ...p, minHeight: v }))} />
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: "#888", letterSpacing: "2px", marginBottom: "6px" }}>SENSATIONS (1-5)</label>
                    <input type="range" min="1" max="5" value={newAttraction.thrill} onChange={e => setNewAttraction(p => ({ ...p, thrill: e.target.value }))} style={{ width: "100%" }} />
                    <span style={{ color: "#f5a623" }}>{newAttraction.thrill}/5</span>
                  </div>
                </div>
                <AdminInput label="Tags (séparés par virgule)" value={newAttraction.tags} onChange={v => setNewAttraction(p => ({ ...p, tags: v }))} />
                <AdminInput label="Mon conseil" value={newAttraction.tip} onChange={v => setNewAttraction(p => ({ ...p, tip: v }))} rows={2} />
                <button onClick={() => addAttraction(park.id)} style={{ background: "#f5a623", color: "#000", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontFamily: "inherit", fontSize: "14px" }}>AJOUTER L'ATTRACTION</button>
              </div>
            )}
          </div>
        )}
        {adminParkView === "shop" && <AdminShop park={park} onUpdate={(shop) => updateParkShop(park.id, shop)} />}
      </div>
    );
  };

  const renderAdminAttraction = () => {
    if (!attraction || !park) return null;
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <button onClick={() => setView("admin-park")} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", fontFamily: "inherit", marginBottom: "24px" }}>← {park.name}</button>
        <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "42px", color: "#fff", letterSpacing: "2px", marginBottom: "32px" }}>{attraction.name}</h2>
        <div style={{ background: "#111", borderRadius: "16px", padding: "28px", marginBottom: "24px", border: "1px solid #1e1e1e" }}>
          <div style={{ fontSize: "11px", color: "#888", letterSpacing: "3px", marginBottom: "16px" }}>✨ BIO IA</div>
          {attraction.bio && <p style={{ color: "#6ab06a", fontSize: "13px", marginBottom: "12px" }}>✓ Bio générée — {attraction.bio.intro?.substring(0, 80)}...</p>}
          <AIBioGenerator attraction={attraction} parkName={park.name} onBioGenerated={(bio) => handleBioGenerated(park.id, attraction.id, bio)} />
        </div>
        <div style={{ background: "#111", borderRadius: "16px", padding: "28px", marginBottom: "24px", border: "1px solid #1e1e1e" }}>
          <div style={{ fontSize: "11px", color: "#888", letterSpacing: "3px", marginBottom: "16px" }}>📷 PHOTOS ({attraction.photos.length})</div>
          {attraction.photos.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "8px", marginBottom: "16px" }}>
              {attraction.photos.map((photo, i) => (
                <div key={i} style={{ borderRadius: "8px", overflow: "hidden", aspectRatio: "4/3", position: "relative" }}>
                  <img src={photo.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={() => setData(d => ({ ...d, parks: d.parks.map(p => p.id === park.id ? { ...p, attractions: p.attractions.map(a => a.id === attraction.id ? { ...a, photos: a.photos.filter((_, idx) => idx !== i) } : a) } : p) }))} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", fontSize: "12px" }}>×</button>
                </div>
              ))}
            </div>
          )}
          <div onClick={() => { const input = document.createElement("input"); input.type = "file"; input.accept = "image/*"; input.multiple = true; input.onchange = e => handlePhotoUpload(park.id, attraction.id, e.target.files); input.click(); }} style={{ border: "2px dashed #2a2a2a", borderRadius: "12px", padding: "24px", textAlign: "center", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#f5a623"} onMouseLeave={e => e.currentTarget.style.borderColor = "#2a2a2a"}>
            <div style={{ fontSize: "28px", marginBottom: "6px" }}>📸</div>
            <p style={{ color: "#555", fontSize: "13px" }}>Cliquer pour ajouter des photos</p>
          </div>
        </div>
        <div style={{ background: "#111", borderRadius: "16px", padding: "28px", border: "1px solid #1e1e1e" }}>
          <div style={{ fontSize: "11px", color: "#888", letterSpacing: "3px", marginBottom: "16px" }}>💡 MON CONSEIL</div>
          <textarea value={attraction.tip} onChange={e => { const val = e.target.value; setData(d => ({ ...d, parks: d.parks.map(p => p.id === park.id ? { ...p, attractions: p.attractions.map(a => a.id === attraction.id ? { ...a, tip: val } : a) } : p) })); }} rows={4} style={{ width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "12px 16px", color: "#e8e0d0", fontSize: "14px", fontFamily: "inherit", resize: "vertical" }} />
        </div>
      </div>
    );
  };

  // LOGIN ADMIN
  if (!adminUnlocked && mode === "admin") {
    return (
      <>
        <style>{CSS}</style>
        <div style={{ minHeight: "100vh", background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#111", borderRadius: "16px", padding: "40px", border: "1px solid #1e1e1e", width: "360px" }}>
            <h2 style={{ fontFamily: "'Bebas Neue'", fontSize: "32px", color: "#fff", marginBottom: "8px", letterSpacing: "2px" }}>ACCÈS ADMIN</h2>
            <p style={{ color: "#555", fontSize: "13px", marginBottom: "24px" }}>Mot de passe : <span style={{ color: "#888" }}>admin</span></p>
            <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && adminPassword === "admin" && setAdminUnlocked(true)} placeholder="Mot de passe..." style={{ width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", padding: "12px 16px", color: "#e8e0d0", fontSize: "14px", fontFamily: "inherit", marginBottom: "16px" }} />
            <button onClick={() => adminPassword === "admin" && setAdminUnlocked(true)} style={{ width: "100%", background: "#f5a623", color: "#000", border: "none", padding: "12px", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontFamily: "inherit", fontSize: "14px" }}>ENTRER</button>
            <button onClick={() => setMode("visitor")} style={{ width: "100%", background: "transparent", border: "none", color: "#555", cursor: "pointer", marginTop: "12px", fontFamily: "inherit", fontSize: "13px" }}>← Retour au blog</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", background: "#0d0d0d" }}>
        <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(13,13,13,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid #1a1a1a", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div onClick={() => { setView(mode === "admin" ? "admin-home" : "home"); setSelectedPark(null); setSelectedAttraction(null); }} style={{ fontFamily: "'Bebas Neue'", fontSize: "22px", color: "#fff", cursor: "pointer", letterSpacing: "3px", whiteSpace: "nowrap" }}>
              PARCS & <span style={{ color: "#f5a623" }}>SENSATIONS</span>
            </div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {data.parks.map(p => (
                <button key={p.id} onClick={() => { setSelectedPark(p.id); setSelectedAttraction(null); setParkTab("attractions"); setAdminParkView("attractions"); setView(mode === "admin" ? "admin-park" : "park"); }} style={{ background: selectedPark === p.id ? "#f5a623" : "transparent", color: selectedPark === p.id ? "#000" : "#666", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit", fontSize: "13px", fontWeight: selectedPark === p.id ? "700" : "400", transition: "all 0.2s" }}
                  onMouseEnter={e => selectedPark !== p.id && (e.target.style.color = "#fff")}
                  onMouseLeave={e => selectedPark !== p.id && (e.target.style.color = "#666")}>
                  {p.emoji} {p.name}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => { setMode(mode === "admin" ? "visitor" : "admin"); setView(mode === "admin" ? "home" : "admin-home"); }} style={{ background: mode === "admin" ? "#f5a623" : "transparent", color: mode === "admin" ? "#000" : "#555", border: "1px solid", borderColor: mode === "admin" ? "#f5a623" : "#2a2a2a", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit", fontSize: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>
            {mode === "admin" ? "⚡ MODE ADMIN" : "Admin"}
          </button>
        </nav>
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
