import { BrowserRouter, Routes, Route } from "react-router-dom"
import LandingPage from "./pages/LandingPage"
import PortalPage from "./pages/PortalPage"
import ReferralDetailPage from "./pages/ReferralDetailPage"
import ProcessingPage from "./pages/ProcessingPage"
import ResultPage from "./pages/ResultPage"
import SchedulingPage from "./pages/SchedulingPage"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/portal" element={<PortalPage />} />
        <Route path="/referral/:id" element={<ReferralDetailPage />} />
        <Route path="/processing/:id" element={<ProcessingPage />} />
        <Route path="/result/:id" element={<ResultPage />} />
        <Route path="/schedule/:id" element={<SchedulingPage />} />
      </Routes>
    </BrowserRouter>
  )
}