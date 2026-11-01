import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WAGER_CONTRACT_ADDRESS = "0xb4ae90c48ED8173739d4962C1b6E0d2762589A7b";
const EVO_TOKEN_ADDRESS = "0xCf04daFF98D9F92115cD6F1e188f660e764585D2";

const WAGER_ABI = [
  "function createWager(uint256 _amount) external returns (uint256)",
  "function acceptWager(uint256 _wagerId) external",
  "function wagerCounter() view returns (uint256)",
  "function wagers(uint256) view returns (address player1, address player2, uint256 amount, bool isAccepted, bool isResolved, address winner)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)"
];

const VERIFICATION_CONTRACT_ADDRESS = "0xBceD6293Cb21f19DFC507042a0642d7241305Eb0";
const VERIFICATION_ABI = [
    "function isVerified(address _user) view returns (bool)"
];
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "isVerified",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }
];
export default function WagerDashboard() {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
    const [activeWagers, setActiveWagers] = useState([]);
    const [isUserVerified, setIsUserVerified] = useState(false);

    useEffect(() => {
        async function checkBadgeOnChain() {
            if (!window.ethereum) return;
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const userAddress = await signer.getAddress();

                const contract = new ethers.Contract(VERIFICATION_CONTRACT_ADDRESS, VERIFICATION_ABI, provider);
                const verifiedStatus = await contract.isVerified(userAddress);
                
                setIsUserVerified(verifiedStatus);
            } catch (err) {
                console.error("Greška pri dohvatu verifikacije s blockchaina:", err);
            }
        }
        
        checkBadgeOnChain();
    }, []);

    // Funkcija za dohvat aktivnih oklada s pametnog ugovora
    async function fetchWagers() {
    try {
      if (!window.ethereum) return;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const wagerContract = new ethers.Contract(WAGER_CONTRACT_ADDRESS, WAGER_ABI, provider);

      const count = await wagerContract.wagerCounter();
      let wagersList = [];

      for (let i = 1; i <= Number(count); i++) {
        const wager = await wagerContract.wagers(i);
        // Prikazujemo samo oklade koje još nisu prihvaćene ni završene
        if (!wager.isAccepted && !wager.isResolved) {
          wagersList.push({
            id: i,
            player1: wager.player1,
            amount: ethers.formatUnits(wager.amount, 18)
          });
        }
      }
      setActiveWagers(wagersList);
    } catch (err) {
      console.error("Greška kod dohvata oklada:", err);
    }
  }

  useEffect(() => {
    fetchWagers();
  }, []);

  // 1. Kreiranje oklade
  async function handleCreateWager(e) {
    e.preventDefault();
    try {
      if (!window.ethereum) return alert("Instaliraj MetaMask!");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract(EVO_TOKEN_ADDRESS, ERC20_ABI, signer);
      const wagerContract = new ethers.Contract(WAGER_CONTRACT_ADDRESS, WAGER_ABI, signer);

      const parsedAmount = ethers.parseUnits(amount, 18);

      setStatus("Odobravanje tokena (Approval)...");
      const approveTx = await tokenContract.approve(WAGER_CONTRACT_ADDRESS, parsedAmount);
      await approveTx.wait();

      setStatus("Kreiranje oklade u tijeku...");
      const wagerTx = await wagerContract.createWager(parsedAmount);
      await wagerTx.wait();

      setStatus("Oklada uspješno kreirana i zaključana u Escrowu!");
      fetchWagers(); // Osvježi popis
    } catch (err) {
      console.error(err);
      setStatus("Greška: " + (err.reason || err.message));
    }
  }

  // 2. Prihvaćanje oklade preko kartice
  async function handleAcceptWager(wagerId, wagerAmount) {
    try {
      if (!window.ethereum) return alert("Instaliraj MetaMask!");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract(EVO_TOKEN_ADDRESS, ERC20_ABI, signer);
      const wagerContract = new ethers.Contract(WAGER_CONTRACT_ADDRESS, WAGER_ABI, signer);

      const parsedAmount = ethers.parseUnits(wagerAmount, 18);

      setStatus(`Odobravanje tokena za okladu #${wagerId}...`);
      const approveTx = await tokenContract.approve(WAGER_CONTRACT_ADDRESS, parsedAmount);
      await approveTx.wait();

      setStatus(`Prihvaćanje oklade #${wagerId}...`);
      const acceptTx = await wagerContract.acceptWager(wagerId);
      await acceptTx.wait();

      setStatus(`Oklada #${wagerId} uspješno prihvaćena!`);
      fetchWagers(); // Osvježi popis
    } catch (err) {
      console.error(err);
      setStatus("Greška: " + (err.reason || err.message));
    }
  }

  return (
    <div className="bg-zinc-950 border border-purple-500/30 p-6 rounded-2xl text-white max-w-lg mx-auto shadow-[0_0_30px_rgba(168,85,247,0.15)] space-y-6">
      <h2 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent">
        Evolysium P2P Arena
      </h2>

      {/* Kreiraj okladu */}
      <form onSubmit={handleCreateWager} className="space-y-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <label className="text-sm text-zinc-400 font-medium">Kreiraj novi izazov</label>
        <div className="flex gap-2">
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Iznos u $EVO" 
            className="flex-1 bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none text-sm"
          />
          <button type="submit" className="px-5 py-3 bg-gradient-to-r from-amber-500 to-purple-600 font-bold rounded-xl text-black hover:opacity-90 text-sm">
            Baci Izazov
          </button>
        </div>
      </form>

      {/* Popis aktivnih oklada */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-zinc-300">Aktivni izazovi na čekanju</h3>
          <button onClick={fetchWagers} className="text-xs text-purple-400 hover:underline">Osvježi</button>
        </div>

        {activeWagers.length === 0 ? (
          <p className="text-xs text-zinc-500 italic bg-black/40 p-4 rounded-xl text-center border border-zinc-900">Trenutno nema aktivnih izazova.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {activeWagers.map((w) => (
              <div key={w.id} className="flex items-center justify-between bg-black border border-zinc-800 p-3 rounded-xl">
                <div>
                  <p className="text-xs font-bold text-amber-400">Oklada #{w.id}</p>
                  <p className="text-xs text-zinc-400">Ulog: <span className="text-white font-semibold">{w.amount} $EVO</span></p>
                  <p className="text-[10px] text-zinc-600 truncate w-36">Creator: {w.player1}</p>
                </div>
                <button 
                  onClick={() => handleAcceptWager(w.id, w.amount)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 font-bold text-xs rounded-lg text-white transition-colors"
                >
                  Prihvati
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {status && <p className="text-xs text-amber-400 bg-zinc-900 p-3 rounded-lg border border-zinc-800">{status}</p>}
    </div>
  );
}
