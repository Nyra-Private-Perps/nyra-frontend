import { Twitter, Github, MessageSquare } from "lucide-react";
const EliteFooter = () => {
    return (
      <footer className="bg-white pt-32 pb-12 border-t border-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 mb-24">
            
            {/* Brand Column */}
            <div className="lg:col-span-4 space-y-8">
              <h3 className="font-serif font-bold text-3xl text-[#111827]">Nyra</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs font-medium">
                Nyra is a decentralized privacy-preservation layer for perpetual trading. We do not hold user funds.
              </p>
              <div className="flex gap-4">
                {[
                  { icon: <Twitter size={18} />, href: "#" },
                  { icon: <Github size={18} />, href: "#" },
                  { icon: <MessageSquare size={18} />, href: "#" }
                ].map((social, i) => (
                  <a 
                    key={i} 
                    href={social.href}
                    className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white hover:border-black transition-all shadow-sm"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
  
            {/* Nav Links columns */}
            <div className="lg:col-span-2">
              <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#111827] mb-8">Protocol</h5>
              <ul className="space-y-4 text-sm text-gray-400 font-medium">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Github</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Audits</a></li>
              </ul>
            </div>
  
            <div className="lg:col-span-2">
              <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#111827] mb-8">Community</h5>
              <ul className="space-y-4 text-sm text-gray-400 font-medium">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Twitter / X</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Governance</a></li>
              </ul>
            </div>
  
            <div className="lg:col-span-2">
              <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#111827] mb-8">Legal</h5>
              <ul className="space-y-4 text-sm text-gray-400 font-medium">
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a></li>
              </ul>
            </div>
  
            {/* Status Column */}
            <div className="lg:col-span-2">
              <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 shadow-sm">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Operational</span>
                 </div>
                 <p className="text-[11px] text-gray-400 font-bold leading-relaxed">All systems functioning normally.</p>
              </div>
            </div>
          </div>
  
          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">© 2025 Nyra Protocol. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="text-[10px] text-gray-300 font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors">Privacy Policy</a>
              <a href="#" className="text-[10px] text-gray-300 font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    );
  };
  export default EliteFooter;