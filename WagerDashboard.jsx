import React, { useState } from 'react';
import { ethers } from 'ethers';

const WAGER_CONTRACT_ADDRESS = "OVDJE_STAVI_ADRESU_WAGER_UGOVORA"; // Ovdje upisuješ adresu onog drugog ugovora iz Remixa
const EVO_TOKEN_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138";

const WAGER_ABI = [
  "function createWager(uint256 _amount) external returns (uint256)",
  "function acceptWager(uint256 _wagerId) external",
  "function wagerCounter() view returns (uint256)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)"
];

export default function WagerDashboard() {
  const [amount, setAmount] = useState('');
  const [wagerIdToAccept, setWagerIdToAccept] = useState('');
  const [status, setStatus] = useState('');

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
    } catch (err) {
      console.error(err);
      setStatus("Greška: " + err.reason);
    }
  }

  async function handleAcceptWager(e) {
    e.preventDefault();
    try {
      if (!window.ethereum) return alert("Instaliraj MetaMask!");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tokenContract = new ethers.Contract(EVO_TOKEN_ADDRESS, ERC20_ABI, signer);
      const wagerContract = new ethers.Contract("0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8", WAGER_ABI, signer);

      const parsedAmount = ethers.parseUnits("10", 18); 

      setStatus("Odobravanje tokena...");
      const approveTx = await tokenContract.approve(WAGER_CONTRACT_ADDRESS, parsedAmount);
      await approveTx.wait();

      setStatus("Prihvaćanje oklade...");
      const acceptTx = await wagerContract.acceptWager(wagerIdToAccept);
      await acceptTx.wait();

      setStatus("Oklada uspješno prihvaćena! Sredstva su zaključana.");
    } catch (err) {
      console.error(err);
      setStatus("Greška: " + err.reason);
    }
  }

  return (
    <div className="bg-zinc-950 border border-purple-500/30 p-6 rounded-2xl text-white max-w-md mx-auto shadow-[0_0_30px_rgba(168,85,247,0.15)]">
      <h2 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent mb-4">
        Evolysium P2P Arena
      </h2>

      <form onSubmit={handleCreateWager} className="space-y-3 mb-6">
        <label className="text-sm text-zinc-400">Kreiraj izazov ($EVO iznos)</label>
        <input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)}
          placeholder="npr. 50" 
          className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
        />
        <button type="submit" className="w-full py-3 bg-gradient-to-r from-amber-500 to-purple-600 font-bold rounded-xl text-black hover:opacity-90">
          Baci Izazov (Create Wager)
        </button>
      </form>

      <hr className="border-zinc-800 mb-6" />

      <form onSubmit={handleAcceptWager} className="space-y-3">
        <label className="text-sm text-zinc-400">Prihvati tuđi izazov (ID oklade)</label>
        <input 
          type="number" 
          value={wagerIdToAccept} 
          onChange={(e) => setWagerIdToAccept(e.target.value)}
          placeholder="npr. 1" 
          className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
        />
        <button type="submit" className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-purple-500/30 font-bold rounded-xl text-white">
          Prihvati Okladu
        </button>
      </form>

      {status && <p className="mt-4 text-xs text-amber-400 bg-zinc-900 p-3 rounded-lg border border-zinc-800">{status}</p>}
    </div>
  );
}
