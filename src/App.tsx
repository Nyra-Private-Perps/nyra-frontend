import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "../src/lib/wagmiConfig"; 

// Import Pages
import HomePage from "../src/pages/HomePage";
import VaultsPage from "./pages/Vault"; // <--- The file we created in Step 1
import VaultDetailPage from "./pages/VaultDetail"; // <--- The file you provided earlier
import FaucetPage from "./pages/Faucet";
import ProfilePage from "./pages/Profile";

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            
            {/* The List Page */}
            <Route path="/vaults" element={<VaultsPage />} />
            
            {/* The Detail Page (Matches "onClick={() => navigate(`/vaults/${slug}`)}" in VaultCard) */}
            <Route path="/vaults/:slug" element={<VaultDetailPage />} />
            
            <Route path="/faucet" element={<FaucetPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App;
