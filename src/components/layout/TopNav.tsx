import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/work", label: "Work" },
  { to: "/playground", label: "Playground" },
  { to: "/lab-log", label: "Build Feed" },
  { to: "/contact", label: "Contact" }
];

export function TopNav() {
  return (
    <header className="top-nav">
      <NavLink className="brand" to="/">
        CATALIN SIEGLING
      </NavLink>
      <nav>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
