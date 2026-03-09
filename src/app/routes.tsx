import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { HomePage } from "../pages/HomePage";
import { PlaygroundPage } from "../pages/PlaygroundPage";
import { WorkPage } from "../pages/WorkPage";
import { WorkIndexPage } from "../pages/WorkIndexPage";
import { LabLogPage } from "../pages/LabLogPage";
import { ContactPage } from "../pages/ContactPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "playground", element: <PlaygroundPage /> },
      { path: "work", element: <WorkIndexPage /> },
      { path: "work/:slug", element: <WorkPage /> },
      { path: "lab-log", element: <LabLogPage /> },
      { path: "contact", element: <ContactPage /> },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);
