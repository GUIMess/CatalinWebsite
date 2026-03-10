import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home", note: "live system", index: "00" },
  { to: "/work", label: "Work", note: "system views", index: "01" },
  { to: "/playground", label: "Playground", note: "active lab", index: "02" },
  { to: "/lab-log", label: "Build Feed", note: "recent fixes", index: "03" },
  { to: "/contact", label: "Contact", note: "reach out", index: "04" }
];

export function TopNav() {
  return (
    <header className="top-nav top-nav-authored">
      <NavLink className="brand brand-block" to="/">
        <span className="brand-mark">Catalin Siegling</span>
        <span className="brand-sub">Live systems and interface experiments</span>
      </NavLink>
      <nav className="nav-cluster" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            <span className="nav-index">{item.index}</span>
            <span className="nav-copy">
              <strong>{item.label}</strong>
              <small>{item.note}</small>
            </span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
