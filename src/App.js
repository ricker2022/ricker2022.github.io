import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const STATUS_LIST = ["待報價", "已報價", "報價回簽中", "製作中", "修改中", "結案", "待請款", "已請款", "款項已入帳"];
const CUSTOMERS = ["BRITA", "待新增"];

const PRICE_LEVEL = {
  website: { high: 20000, normal: 15000 },
  design: { high: 3000, normal: 1000 }
};

function getPriceLevel(type, price) {
  const { high, normal } = PRICE_LEVEL[type];
  return price >= high ? "🟢 高價" : price >= normal ? "🟡 正常" : "🔴 偏低";
}

const STATUS_PROGRESS = {
  "待報價": 0,
  "已報價": 10,
  "報價回簽中": 20,
  "製作中": 50,
  "修改中": 70,
  "結案": 80,
  "待請款": 85,
  "已請款": 90,
  "款項已入帳": 100
};

const STATUS_COLOR = {
  "待報價": "#ef4444",
  "已報價": "#ef4444",
  "報價回簽中": "#facc15",
  "製作中": "#facc15",
  "修改中": "#facc15",
  "結案": "#22c55e",
  "待請款": "#22c55e",
  "已請款": "#22c55e",
  "款項已入帳": "#22c55e"
};

const inputStyle = {
  width: "100%",
  padding: 8,
  borderRadius: 10,
  border: "none",
  marginBottom: 10,
  background: "#334155",
  color: "white"
};

export default function App() {
  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    type: "website",
    client: "",
    price: "",
    status: "待報價",
    showProgress: true
  });

  // 初始化 + 檢查備份
  useEffect(() => {
    const data = localStorage.getItem("projects");
    if (data) setProjects(JSON.parse(data));

    const backup = localStorage.getItem("projects_backup");
    if (backup && backup !== data && window.confirm("檢測到舊備份資料，是否要匯入？")) {
      setProjects(JSON.parse(backup));
    }
  }, []);

  // 自動儲存 + 備份
  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
    localStorage.setItem("projects_backup", JSON.stringify(projects));
  }, [projects]);

  const saveProject = () => {
    if (!form.title) return;
    const newProject = {
      ...form,
      id: editingId || Date.now(),
      priceLevel: getPriceLevel(form.type, Number(form.price))
    };
    if (editingId) {
      setProjects(projects.map(p => (p.id === editingId ? newProject : p)));
      setEditingId(null);
    } else setProjects([newProject, ...projects]);
    setForm({ title: "", type: "website", client: "", price: "", status: "待報價", showProgress: true });
  };

  const deleteProject = (id) => {
    if (window.confirm("確定要刪除這個專案嗎？")) setProjects(projects.filter(p => p.id !== id));
  };

  const exportProjects = () => {
    const dataStr = JSON.stringify(projects, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "projects_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProjects = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) setProjects(imported);
        else alert("檔案格式不正確");
      } catch {
        alert("無法解析 JSON");
      }
    };
    reader.readAsText(file);
  };

  const filteredProjects = projects.filter(p => {
    if (filter === "all") return true;
    if (filter === "website" || filter === "design") return p.type === filter;
    return p.client === filter;
  });

  const totalIncome = projects.reduce((sum, p) => sum + Number(p.price || 0), 0);
  const websiteIncome = projects.filter(p => p.type === "website").reduce((sum, p) => sum + Number(p.price || 0), 0);
  const designIncome = projects.filter(p => p.type === "design").reduce((sum, p) => sum + Number(p.price || 0), 0);

  const chartData = {
    labels: ["網站", "設計"],
    datasets: [{
      label: "收入",
      data: [websiteIncome, designIncome],
      backgroundColor: ["#22c55e", "#facc15"],
      borderRadius: 10
    }]
  };

  return (
    <div style={{ padding: 20, minHeight: "100vh", background: "#0f172a", color: "white", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: 10 }}>🔥 專案管理系統</h1>

      {/* 匯出 / 匯入 */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={exportProjects} style={{ marginRight: 10, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "#22c55e", color: "white" }}>
          匯出資料
        </button>
        <label style={{ padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: "#3b82f6", color: "white" }}>
          匯入資料
          <input type="file" accept=".json" onChange={importProjects} style={{ display: "none" }} />
        </label>
      </div>

      <h2 style={{ marginBottom: 10 }}>💰 總收入：{totalIncome}</h2>
      <div style={{ maxWidth: 500, marginBottom: 20, background: "#1e293b", padding: 10, borderRadius: 16 }}>
        <Bar data={chartData} options={{ plugins: { legend: { labels: { color: "white" } } }, scales: { x: { ticks: { color: "white" } }, y: { ticks: { color: "white" } }}}} />
      </div>

      {/* 篩選 */}
      <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 10 }}>
        {["all", "website", "design"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: filter === f ? "linear-gradient(90deg, #22c55e, #4ade80)" : "#334155",
              color: "white"
            }}
          >
            {f === "all" ? "全部" : f === "website" ? "網站" : "設計"}
          </button>
        ))}
        {CUSTOMERS.map(client => (
          <button key={client} onClick={() => setFilter(client)}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background: filter === client ? "linear-gradient(90deg, #22c55e, #4ade80)" : "#334155",
              color: "white"
            }}
          >
            {client}
          </button>
        ))}
      </div>

      {/* 表單 */}
      <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", padding: 20, borderRadius: 16, marginBottom: 20, maxWidth: 500 }}>
        <h3 style={{ marginBottom: 10 }}>新增 / 編輯專案</h3>
        <input placeholder="名稱" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} />
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={inputStyle}>
          <option value="website">網站</option>
          <option value="design">設計</option>
        </select>
        <select value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} style={inputStyle}>
          <option value="">請選擇客戶</option>
          {CUSTOMERS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="金額" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inputStyle} />
        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={inputStyle}>
          {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={saveProject} style={{ width: "100%", padding: 10, borderRadius: 10, border: "none", cursor: "pointer", background: "linear-gradient(90deg, #22c55e, #4ade80)", color: "white", fontWeight: "bold" }}>
          {editingId ? "更新專案" : "新增專案"}
        </button>
      </div>

      {/* 專案卡片 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 20 }}>
        {filteredProjects.map(p => (
          <div key={p.id} onClick={() => { setForm(p); setEditingId(p.id); }}
            style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", padding: 16, borderRadius: 20, boxShadow: "0 8px 25px rgba(0,0,0,0.5)", transition: "0.3s", cursor: "pointer" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <h3 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 5 }}>{p.title}</h3>
            <p>{p.type === "website" ? "💻 網站" : "🎨 設計"}</p>
            <p>👤 {p.client || "-"}</p>
            <p>💰 {p.price}（{p.priceLevel}）</p>
            <p>📌 {p.status}</p>

            {p.showProgress && (
              <div style={{ marginTop: 8 }}>
                <div style={{ background: "#334155", height: 8, borderRadius: 5, marginBottom: 4 }}>
                  <div style={{ width: `${STATUS_PROGRESS[p.status]}%`, height: "100%", borderRadius: 5, background: STATUS_COLOR[p.status], transition: "width 0.3s" }} />
                </div>
                <p style={{ fontSize: 12, marginTop: 2 }}>{STATUS_PROGRESS[p.status]}%</p>
              </div>
            )}

            <textarea
              placeholder="紀錄專案製作過程..."
              value={p.note || ""}
              onChange={e => {
                const updated = projects.map(pr => pr.id === p.id ? { ...pr, note: e.target.value } : pr);
                setProjects(updated);
              }}
              style={{ width: "100%", marginTop: 8, borderRadius: 8, padding: 6, border: "none", background: "#1e293b", color: "white", resize: "vertical", minHeight: 60 }}
            />

            <button onClick={e => { e.stopPropagation(); deleteProject(p.id); }} style={{ marginTop: 10, width: "100%", padding: 6, borderRadius: 10, border: "none", cursor: "pointer", background: "#ef4444", color: "white" }}>刪除</button>
          </div>
        ))}
      </div>
    </div>
  );
}