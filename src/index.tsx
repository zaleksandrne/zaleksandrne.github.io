import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import WebRTCApp from "./components/WebRTCApp";
import "./index.css";

import { HashRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <HashRouter>
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/room/default-room" element={<WebRTCApp />} />
        </Routes>
    </HashRouter>
);