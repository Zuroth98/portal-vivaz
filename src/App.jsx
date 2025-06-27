import React, { useState, useEffect, useRef, useMemo } from 'react';

// =================================================================================
// 1. IMPORTAÇÕES E CONFIGURAÇÃO
// =================================================================================
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, signInAnonymously } from "firebase/auth";
import { getDatabase, ref as dbRef, onValue, set, push, remove, update } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBTjS_1Xg-PdOQ2e6oIAWnybRVzDPX9kb8",
    authDomain: "vivazjacomo.firebaseapp.com",
    projectId: "vivazjacomo",
    storageBucket: "vivazjacomo.appspot.com",
    messagingSenderId: "990335473995",
    appId: "1:990335473995:web:bee96b37a5180e33a1f0ce",
    measurementId: "G-6BS22SF77D",
    databaseURL: "https://vivazjacomo-default-rtdb.firebaseio.com"
};

const Maps_API_KEY = "AIzaSyDh3XiWnfaisTsEDSmaL7Ed8GbCXR6hP_4";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

// --- HOOK PARA CARREGAR SCRIPTS EXTERNOS ---
const useScript = (url, callbackName) => {
    useEffect(() => {
        if (document.querySelector(`script[src*="${callbackName}"]`)) {
            if (window[callbackName] && typeof window[callbackName] === 'function') {
                window[callbackName]();
            }
            return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, [url, callbackName]);
};

// =================================================================================
// COMPONENTES E FUNÇÕES UTILITÁRIAS GLOBAIS
// =================================================================================

const Icon = ({ name, className }) => {
    const icons = {
        newspaper: <><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h4"/><path d="M4 22a2 2 0 0 0-2 2h16a2 2 0 0 0 2-2"/><path d="M18 12h-8"/><path d="M18 8h-8"/><path d="M12 16h-2"/></>,
        mapPin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
        bed: <><path d="M12 21v-8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8"/><path d="M20 21v-8a2 2 0 0 0-2-2h-4"/><path d="M4 11V9a2 2 0 0 1 2-2h2"/><path d="M14 3v2"/><path d="M20 3v2"/><path d="M10 3v2"/></>,
        ruler: <><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L3 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/></>,
        menu: <><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></>,
        x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
        trash: <><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
        logOut: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
        plusCircle: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></>,
        arrowLeft: <><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></>,
        chevronUp: <path d="m18 15-6-6-6 6"/>,
        chevronDown: <path d="m6 9 6 6 6-6"/>,
        layoutDashboard: <><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></>,
        edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
        download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
        alertTriangle: <><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17"/></>,
        checkCircle: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
        xCircle: <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>,
        calculator: <><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><line x1="16" x2="12" y1="14" y2="14"/><line x1="12" x2="12" y1="14" y2="18"/><line x1="8" x2="8" y1="10" y2="18"/><line x1="8" x2="4" y1="14" y2="14"/></>,
        star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 18.17l-6.18 3.25L7 14.14l-5-4.87 8.91-1.01L12 2z"/>,
        chevronsLeft: <><path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/></>,
        chevronsRight: <><path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/></>
    };
    return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{icons[name]}</svg>;
};

const parseDateForSort = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return 999999;
    if (dateString.toLowerCase() === 'pronto') return 1;
    if (!dateString.includes('/')) return 999999;
    const monthMap = { 'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4, 'mai': 5, 'jun': 6, 'jul': 7, 'ago': 8, 'set': 9, 'out': 10, 'nov': 11, 'dez': 12 };
    const [monthStr, yearStr] = dateString.toLowerCase().split('/');
    const year = parseInt(yearStr, 10);
    const month = monthMap[monthStr];
    if (isNaN(year) || !month) return 999999;
    return (2000 + year) * 100 + month;
};

const Sidebar = ({ isSidebarOpen, setSidebarOpen, userRole, setActivePage, activePage, user, onLogout }) => {
    const navItems = [
        { name: 'Início', page: 'inicio', icon: 'newspaper' },
        { name: 'Mapa', page: 'mapa', icon: 'mapPin' },
        { name: 'Tabelas', page: 'tabelas', icon: 'layoutDashboard' },
        { name: 'Simulador', page: 'simulador', icon: 'calculator' },
        { name: 'Documentação', page: 'documentacao', icon: 'download' }
    ];

    if (userRole === 'admin') {
        navItems.push({ name: 'Painel Admin', page: 'adminDashboard', icon: 'layoutDashboard' });
        navItems.push({ name: 'Agendamentos', page: 'agendamentos', icon: 'bed' });
    }

    const NavLink = ({ page, icon, children }) => (
        <button
            onClick={() => setActivePage(page)}
            className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activePage === page 
                ? 'bg-teal-500 text-white' 
                : 'text-slate-600 hover:bg-slate-200'
            }`}
        >
            <Icon name={icon} className="w-6 h-6" />
            <span className={`ml-4 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>{children}</span>
        </button>
    );

    return (
        <div className={`fixed top-0 left-0 h-full bg-white/80 backdrop-blur-lg shadow-lg z-50 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className="flex items-center justify-center h-20 border-b shrink-0">
                <span className={`text-2xl font-bold text-teal-600 cursor-pointer overflow-hidden ${isSidebarOpen ? 'w-auto' : 'w-0'}`} onClick={() => setActivePage('inicio')}>
                    Vivaz
                </span>
            </div>
            <nav className="flex-grow p-4 space-y-2">
                {navItems.map(item => <NavLink key={item.page} page={item.page} icon={item.icon}>{item.name}</NavLink>)}
            </nav>
            <div className="p-4 border-t">
                {user ? (
                    <button onClick={onLogout} className="flex items-center w-full px-4 py-3 rounded-lg text-slate-600 hover:bg-red-100 hover:text-red-600">
                        <Icon name="logOut" className="w-6 h-6"/>
                        <span className={`ml-4 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Sair</span>
                    </button>
                ) : (
                    <button onClick={() => setActivePage('login')} className="flex items-center w-full px-4 py-3 rounded-lg text-slate-600 hover:bg-blue-100 hover:text-blue-600">
                        <Icon name="logOut" className="w-6 h-6"/>
                        <span className={`ml-4 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Login</span>
                    </button>
                )}
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="flex items-center w-full px-4 py-3 mt-2 rounded-lg text-slate-600 hover:bg-slate-200">
                    <Icon name={isSidebarOpen ? 'chevronsLeft' : 'chevronsRight'} className="w-6 h-6"/>
                    <span className={`ml-4 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>Recolher</span>
                </button>
            </div>
        </div>
    );
};


const NewsSection = ({setActivePage, latestNews}) => {
    return (
        <section className="bg-transparent py-16 md:py-20">
            <div className="text-left max-w-3xl">
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800">Portal da Equipe</h1>
                <p className="mt-4 text-lg text-slate-600">Seja bem-vindo. Aqui você encontra as ferramentas e informações mais recentes para impulsionar suas vendas.</p>
            </div>
            <div className="mt-12">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-700 flex items-center gap-3"><Icon name="newspaper" className="w-7 h-7 text-teal-500" /> Últimas Notícias do Mercado</h2>
                    <button onClick={() => setActivePage('noticias')} className="text-teal-600 font-semibold hover:underline">Ver todas as notícias &rarr;</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {latestNews.map(news => (
                        <a key={news.id} href={news.url} target="_blank" rel="noopener noreferrer" className="block p-6 bg-white/50 backdrop-blur-lg rounded-xl shadow-md border border-white/30 hover:shadow-lg transition-all duration-300">
                            {news.imageUrl && <img src={news.imageUrl} alt={`[Imagem da Notícia]`} className="w-full h-40 object-cover rounded-lg mb-4" />}
                            <h3 className="font-bold text-lg text-slate-800">{news.title}</h3>
                            <p className="text-sm text-slate-500 mt-4">{news.source} - {news.date}</p>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

const NewsPage = ({ allNews }) => {
    return (
        <div className="py-10">
            <h1 className="text-3xl font-bold text-slate-800 mb-8">Notícias do Mercado Imobiliário</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allNews.map(news => (
                     <a key={news.id} href={news.url} target="_blank" rel="noopener noreferrer" className="block p-6 bg-white/50 backdrop-blur-lg rounded-xl shadow-md border border-white/30 hover:shadow-lg transition-all duration-300">
                        {news.imageUrl && <img src={news.imageUrl} alt={`[Imagem da Notícia]`} className="w-full h-40 object-cover rounded-lg mb-4" />}
                        <h3 className="font-bold text-lg text-slate-800">{news.title}</h3>
                        <p className="text-sm text-slate-500 mt-4">{news.source} - {news.date}</p>
                    </a>
                ))}
            </div>
        </div>
    );
}

const ImovelCard = ({ imovel, onViewDetails }) => {
    const statusColors = { 'Lançamento': 'bg-teal-500', 'Em Obras': 'bg-orange-500', 'Pronto para Morar': 'bg-green-500' };
    
    const dormsDisponiveis = imovel.plantas && imovel.plantas.length > 0
        ? [...new Set(imovel.plantas.map(p => p.dormitorios))].sort().join(' e ')
        : 'N/D';

    return (
        <div onClick={() => onViewDetails(imovel, 'inicio')} className="bg-white/50 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-white/30 transition-all duration-300 hover:shadow-2xl hover:border-2 hover:border-teal-400 group cursor-pointer flex flex-col">
            <div className="relative"> <img src={imovel.imagemCapaUrl || 'https://placehold.co/400x300/e2e8f0/64748b?text=Sem+Imagem'} alt={`[Imagem do imóvel]`} className="w-full h-56 object-cover" /> <div className={`absolute top-4 left-4 text-xs font-bold text-white px-3 py-1 rounded-full ${statusColors[imovel.status]}`}> {imovel.status} </div> </div>
            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-slate-800 mb-1">{imovel.nome}</h3>
                <p className="flex items-center text-slate-500 text-sm mb-4"> <Icon name="mapPin" className="w-4 h-4 mr-2" /> {imovel.endereco} </p>
                
                <div className="space-y-3 mt-auto pt-4 border-t border-slate-200/80">
                    <div className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-600">A partir de:</span>
                        <span className="font-bold text-teal-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.valorAPartir || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-600">Entrega:</span>
                        <span className="font-bold text-slate-700">{imovel.dataEntrega}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-600">Opções:</span>
                        <span className="font-bold text-slate-700">{dormsDisponiveis} dorm(s).</span>
                    </div>
                </div>

                <div className="mt-5 w-full text-center bg-teal-50 text-teal-600 font-semibold py-2 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-colors"> Ver Detalhes </div>
            </div>
        </div>
    );
};


const LancamentosSection = ({ imoveis, onViewDetails }) => (
    <section className="py-16 md:py-20">
        <div className="text-center mb-12"> <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Empreendimentos em Destaque</h2> <p className="text-lg text-gray-600 mt-2">Confira as melhores condições para seus clientes.</p> </div>
        {imoveis.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {imoveis.map(imovel => <ImovelCard key={imovel.id} imovel={imovel} onViewDetails={onViewDetails} />)}
            </div>
        ) : ( <p className="text-center text-slate-500">Nenhum lançamento encontrado.</p> )}
    </section>
);

const DetalheImovelPage = ({ imovel, onBack, allImoveis }) => {
    if (!imovel) return null;

    // Lógica para identificadores inteligentes (no detalhe)
    const isBestPrice = useMemo(() => {
        if (!imovel.valorAPartir || imovel.valorAPartir === 0) return false;
        const lowestPrice = Math.min(...allImoveis.map(i => i.valorAPartir || Infinity));
        return imovel.valorAPartir === lowestPrice;
    }, [imovel, allImoveis]);

    const isMostDormsAvailable = useMemo(() => {
        if (!imovel.plantas || imovel.plantas.length === 0) return false;
        const maxDorms = Math.max(...allImoveis.map(i => Math.max(...(i.plantas || []).map(p => parseInt(p.dormitorios) || 0))));
        const currentMaxDorms = Math.max(...imovel.plantas.map(p => parseInt(p.dormitorios) || 0));
        return currentMaxDorms === maxDorms && maxDorms > 0;
    }, [imovel, allImoveis]);

    return (
        <div className="py-10">
             <button onClick={onBack} className="mb-8 flex items-center gap-2 text-slate-600 font-semibold hover:text-teal-600">
                <Icon name="arrowLeft" className="w-5 h-5"/>
                Voltar
            </button>
            <div className="bg-white/50 backdrop-blur-lg p-8 rounded-xl shadow-lg border border-white/20">
                <img src={imovel.imagemCapaUrl || 'https://placehold.co/1200x600/e2e8f0/64748b?text=Sem+Imagem+de+Capa'} alt={`[Imagem principal do imóvel]`} className="w-full h-auto max-h-96 object-cover rounded-lg mb-8"/>
                <h1 className="text-4xl font-bold text-slate-800">{imovel.nome}</h1>
                <p className="flex items-center text-slate-500 text-lg mt-2"> <Icon name="mapPin" className="w-5 h-5 mr-2 text-teal-500" /> {imovel.endereco} </p>
                <p className="text-2xl font-bold text-teal-600 mt-4 mb-8">
                    A partir de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.valorAPartir || 0)}
                </p>

                {/* Identificadores Inteligentes */}
                <div className="flex flex-wrap gap-3 mb-8">
                    {isBestPrice && (
                        <span className="bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                            <Icon name="star" className="w-4 h-4 fill-current text-green-500"/> Melhor Preço
                        </span>
                    )}
                    {isMostDormsAvailable && (
                        <span className="bg-purple-100 text-purple-700 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                            <Icon name="bed" className="w-4 h-4 fill-current text-purple-500"/> Mais Opções de Quartos
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* COLUNA 1: DETALHES GERAIS */}
                    <div>
                        <h3 className="text-2xl font-bold text-slate-700 mb-4 border-b pb-2">Detalhes Gerais</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md"><span className="font-medium">Supervisor</span> <span className="text-slate-600">{imovel.supervisor || 'N/A'}</span></div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md"><span className="font-medium">Data de Entrega</span> <span className="text-slate-600">{imovel.dataEntrega || 'N/A'}</span></div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md"><span className="font-medium">Observações</span> <span className="text-slate-600 text-right">{imovel.observacoes || 'N/A'}</span></div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md"><span className="font-medium">Região</span> <span className="text-slate-600">{imovel.regiao || 'N/A'}</span></div>
                        </div>
                    </div>
                    {/* COLUNA 2: CONDIÇÕES DE PAGAMENTO */}
                    <div>
                        <h3 className="text-2xl font-bold text-slate-700 mb-4 border-b pb-2">Condições</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md"><span className="font-medium">Pró-Soluto</span> <span className="text-slate-600">{imovel.proSoluto || 'N/A'}</span></div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md"><span className="font-medium">Parcelas Mensais</span> <span className="text-slate-600">{imovel.parcelasMensais || 'N/A'}</span></div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md"><span className="font-medium">Parcelas Anuais</span> <span className="text-slate-600">{imovel.parcelasAnuais || 'N/A'}</span></div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md"><span className="font-medium">Meses Restantes</span> <span className="text-slate-600">{imovel.mesesRestantes || 'N/A'}</span></div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md"><span className="font-medium">ITBI e Registro Grátis</span> {imovel.condicoes?.itbiRegistroGratis ? <Icon name="checkCircle" className="w-5 h-5 text-green-500"/> : <Icon name="xCircle" className="w-5 h-5 text-slate-400"/>}</div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-md"><span className="font-medium">Pós Chaves</span> {imovel.condicoes?.posChaves ? <Icon name="checkCircle" className="w-5 h-5 text-green-500"/> : <Icon name="xCircle" className="w-5 h-5 text-slate-400"/>}</div>
                        </div>
                    </div>
                     {/* COLUNA 3: PLANTAS */}
                    <div>
                        <h3 className="text-2xl font-bold text-slate-700 mb-4 border-b pb-2">Plantas Disponíveis</h3>
                        <div className="space-y-3">
                            {imovel.plantas?.map((planta, index) => (
                                <div key={index} className="space-y-2 p-3 bg-slate-50 rounded-md">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{planta.dormitorios} dormitório(s)</span>
                                        <span className="text-slate-600">{planta.area || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-slate-500">Preço:</span>
                                        <span className="text-slate-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(planta.preco || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-slate-500">Vaga:</span>
                                        {planta.possuiVaga ? <Icon name="checkCircle" className="w-5 h-5 inline-block text-green-500"/> : <Icon name="xCircle" className="w-5 h-5 inline-block text-slate-400"/>}
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-slate-500">Avaliação Caixa:</span>
                                        <span className="text-slate-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(planta.avaliacaoCaixa || 0)}</span>
                                    </div>
                                </div>
                            ))}
                             {(!imovel.plantas || imovel.plantas.length === 0) && <p className="text-slate-500 p-3">Nenhuma planta cadastrada.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const AuthPage = ({ onLoginSuccess, setActivePage }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            onLoginSuccess();
        } catch (err) { setError("Falha no login. Verifique seu e-mail e senha."); console.error(err); } finally { setLoading(false); }
    };
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-full max-w-md p-8 space-y-6 bg-white/50 backdrop-blur-xl rounded-xl shadow-lg border border-white/30">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-slate-800">Login de Acesso</h2>
                    <p className="text-slate-500 mt-2">Entre com suas credenciais.</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div> <label className="text-sm font-bold text-gray-600 block mb-1">Email</label> <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition" required /> </div>
                    <div> <label className="text-sm font-bold text-gray-600 block mb-1">Senha</label> <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition" required /> </div>
                    {error && <p className="text-sm text-center text-red-600 bg-red-100 p-2 rounded-lg">{error}</p>}
                    <button type="submit" className="w-full py-3 px-4 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:bg-teal-400 transition-colors" disabled={loading}> {loading ? 'Entrando...' : 'Entrar'} </button>
                </form>
            </div>
        </div>
    );
};

const AdminDashboard = ({ imoveis, onLogout, setActivePage, isMapsApiLoaded, mapsApiError, databaseError }) => {
    const [editingImovel, setEditingImovel] = useState(null);
    const [dadosGerais, setDadosGerais] = useState({ nome: '', status: 'Lançamento', endereco: '', dataEntrega: '', supervisor: '', observacoes: '', proSoluto: '', mesesRestantes: 0, parcelasMensais: 0, parcelasAnuais: 0, regiao: 'Zona Norte' });
    const [condicoes, setCondicoes] = useState({ posChaves: false, itbiRegistroGratis: false });
    const [plantas, setPlantas] = useState([{ dormitorios: '1', area: '', preco: 0, possuiVaga: false, avaliacaoCaixa: 0 }]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [confirmDelete, setConfirmDelete] = useState({ show: false, imovelId: null });
    
    const autocompleteInput = useRef(null);

    useEffect(() => {
        if (!isMapsApiLoaded || !autocompleteInput.current) return;
        const autocomplete = new window.google.maps.places.Autocomplete(autocompleteInput.current, { types: ['address'], componentRestrictions: { country: 'br' } });
        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (place && place.formatted_address) {
                setDadosGerais(prev => ({ ...prev, endereco: place.formatted_address }));
            }
        });
    }, [isMapsApiLoaded]);

    const resetForm = () => {
        setDadosGerais({ nome: '', status: 'Lançamento', endereco: '', dataEntrega: '', supervisor: '', observacoes: '', proSoluto: '', mesesRestantes: 0, parcelasMensais: 0, parcelasAnuais: 0, regiao: 'Zona Norte' });
        setCondicoes({ posChaves: false, itbiRegistroGratis: false });
        setPlantas([{ dormitorios: '1', area: '', preco: 0, possuiVaga: false, avaliacaoCaixa: 0 }]);
    };

    useEffect(() => {
        if (editingImovel) {
            setDadosGerais({
                nome: editingImovel.nome || '',
                status: editingImovel.status || 'Lançamento',
                endereco: editingImovel.endereco || '',
                dataEntrega: editingImovel.dataEntrega || '',
                supervisor: editingImovel.supervisor || '',
                observacoes: editingImovel.observacoes || '',
                proSoluto: editingImovel.proSoluto || '',
                mesesRestantes: editingImovel.mesesRestantes || 0,
                parcelasMensais: editingImovel.parcelasMensais || 0,
                parcelasAnuais: editingImovel.parcelasAnuais || 0,
                regiao: editingImovel.regiao || 'Zona Norte',
            });
            setCondicoes(editingImovel.condicoes || { posChaves: false, itbiRegistroGratis: false });
            setPlantas(editingImovel.plantas && editingImovel.plantas.length > 0 ? editingImovel.plantas : [{ dormitorios: '1', area: '', preco: 0, possuiVaga: false, avaliacaoCaixa: 0 }]);
        } else {
            resetForm();
        }
    }, [editingImovel]);
    
    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
    };

    const getCoordinates = async (address) => {
        if (!address || mapsApiError) return null;
        try {
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${Maps_API_KEY}`);
            const data = await response.json();
            if (data.status === 'OK' && data.results[0]) {
                return data.results[0].geometry.location;
            }
            showNotification(`Não foi possível encontrar coordenadas para: ${address}`, 'error');
            return null;
        } catch (error) { 
            console.error("Geocoding error: ", error); 
            showNotification("Erro ao buscar coordenadas.", "error");
            return null;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            const coordinates = await getCoordinates(dadosGerais.endereco);
            const imovelCompleto = { ...dadosGerais, condicoes, plantas, coordinates, timestamp: Date.now() };
            
            if (editingImovel) {
                await update(dbRef(db, `imoveis/${editingImovel.id}`), imovelCompleto);
                showNotification("Empreendimento atualizado com sucesso!");
            } else {
                await push(dbRef(db, 'imoveis'), imovelCompleto);
                showNotification("Empreendimento adicionado com sucesso!");
            }
            setEditingImovel(null);
        } catch (error) {
            console.error("Erro ao salvar imóvel: ", error);
            showNotification("Ocorreu um erro ao salvar o imóvel.", "error");
        } finally {
            setIsProcessing(false);
        }
    };
    
    const handleDeleteClick = (imovelId) => setConfirmDelete({ show: true, imovelId });
    const handleConfirmDelete = async () => {
        if (!confirmDelete.imovelId) return;
        try { 
            await remove(dbRef(db, `imoveis/${confirmDelete.imovelId}`)); 
            showNotification("Imóvel apagado com sucesso.");
        } catch (e) { console.error("Erro ao deletar: ", e); showNotification("Erro ao apagar o imóvel.", "error"); } 
        finally { setConfirmDelete({ show: false, imovelId: null }); }
    };
    const startEdit = (imovel) => { setEditingImovel(imovel); window.scrollTo(0, 0); };

    const handlePlantasChange = (index, field, value) => {
        const newPlantas = [...plantas];
        newPlantas[index][field] = value;
        setPlantas(newPlantas);
    }

    return (
        <>
            <Notification {...notification} />
            <ConfirmationModal {...confirmDelete} onClose={() => setConfirmDelete({ show: false, imovelId: null })} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja apagar este imóvel?" />
            <div className="py-10">
                <div className="flex justify-between items-center mb-8 flex-wrap gap-4"> 
                    <h1 className="text-3xl font-bold text-slate-800">Painel do Administrador</h1> 
                    <button onClick={onLogout} className="flex items-center gap-2 bg-red-500 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-600"> <Icon name="logOut" className="w-5 h-5" /> Sair </button>
                </div>
                {databaseError && <DatabaseErrorBanner />}
                {mapsApiError && <GoogleApiError />}
                <form onSubmit={handleSubmit} className="bg-white/50 backdrop-blur-lg p-8 rounded-xl shadow-lg border border-white/30 mb-12 space-y-8">
                    <h2 className="text-2xl font-bold text-teal-600">{editingImovel ? `Editando: ${editingImovel.nome}` : "Adicionar Novo Empreendimento"}</h2>
                    {/* DADOS GERAIS */}
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <legend className="text-xl font-semibold mb-4 border-b pb-2 w-full col-span-full">1. Dados Gerais</legend>
                        <div className="lg:col-span-2"><input name="nome" value={dadosGerais.nome} onChange={e => setDadosGerais({...dadosGerais, nome: e.target.value})} placeholder="Nome do Empreendimento" className="p-3 border rounded w-full" required /></div>
                        <div><input name="supervisor" value={dadosGerais.supervisor} onChange={e => setDadosGerais({...dadosGerais, supervisor: e.target.value})} placeholder="Supervisor" className="p-3 border rounded w-full" /></div>
                        <div className="lg:col-span-3"><input ref={autocompleteInput} name="endereco" value={dadosGerais.endereco} onChange={e => setDadosGerais({...dadosGerais, endereco: e.target.value})} placeholder="Endereço Completo (para o mapa)" className="p-3 border rounded w-full" required /></div>
                        <div><select name="status" value={dadosGerais.status} onChange={e => setDadosGerais({...dadosGerais, status: e.target.value})} className="p-3 border rounded w-full"> <option>Lançamento</option> <option>Em Obras</option> <option>Pronto para Morar</option> </select></div>
                        <div><select name="regiao" value={dadosGerais.regiao} onChange={e => setDadosGerais({...dadosGerais, regiao: e.target.value})} className="p-3 border rounded w-full"> <option>Zona Norte</option> <option>Zona Leste</option><option>Zona Oeste</option><option>Zona Sul</option> </select></div>
                        <div><input name="dataEntrega" value={dadosGerais.dataEntrega} onChange={e => setDadosGerais({...dadosGerais, dataEntrega: e.target.value})} placeholder="Data de Entrega (ex: fev/26)" className="p-3 border rounded w-full" /></div>
                        <div className="lg:col-span-3"><textarea name="observacoes" value={dadosGerais.observacoes} onChange={e => setDadosGerais({...dadosGerais, observacoes: e.target.value})} placeholder="Observações" className="p-3 border rounded w-full" rows="2"></textarea></div>
                    </fieldset>
                    {/* CONDIÇÕES E FLUXO */}
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <legend className="text-xl font-semibold mb-4 border-b pb-2 w-full col-span-full">2. Fluxo e Condições</legend>
                        <div><input name="proSoluto" value={dadosGerais.proSoluto} onChange={e => setDadosGerais({...dadosGerais, proSoluto: e.target.value})} placeholder="Pró-Soluto (ex: 16%)" className="p-3 border rounded w-full" /></div>
                        <div><input type="number" name="mesesRestantes" value={dadosGerais.mesesRestantes} onChange={e => setDadosGerais({...dadosGerais, mesesRestantes: Number(e.target.value)})} placeholder="Meses Restantes" className="p-3 border rounded w-full" /></div>
                        <div><input type="number" name="parcelasMensais" value={dadosGerais.parcelasMensais} onChange={e => setDadosGerais({...dadosGerais, parcelasMensais: Number(e.target.value)})} placeholder="Parcelas Mensais" className="p-3 border rounded w-full" /></div>
                        <div><input type="number" name="parcelasAnuais" value={dadosGerais.parcelasAnuais} onChange={e => setDadosGerais({...dadosGerais, parcelasAnuais: Number(e.target.value)})} placeholder="Parcelas Anuais" className="p-3 border rounded w-full" /></div>
                        <div className="flex items-center gap-4 col-span-full">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={condicoes.itbiRegistroGratis} onChange={e => setCondicoes({...condicoes, itbiRegistroGratis: e.target.checked})} className="h-5 w-5 rounded text-teal-600" /> ITBI e Registro Grátis</label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={condicoes.posChaves} onChange={e => setCondicoes({...condicoes, posChaves: e.target.checked})} className="h-5 w-5 rounded text-teal-600" /> Pós Chaves</label>
                        </div>
                    </fieldset>
                    {/* PLANTAS */}
                    <fieldset>
                        <legend className="text-xl font-semibold mb-4 border-b pb-2 w-full">3. Plantas</legend>
                        {plantas.map((planta, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-3 bg-slate-50 rounded mb-2 items-center">
                                <input value={planta.dormitorios} onChange={e => handlePlantasChange(index, 'dormitorios', e.target.value)} placeholder="Dorms" className="p-2 border rounded w-full md:col-span-1" />
                                <input value={planta.area} onChange={e => handlePlantasChange(index, 'area', e.target.value)} placeholder="Área" className="p-2 border rounded w-full md:col-span-1" />
                                <input type="number" value={planta.preco} onChange={e => handlePlantasChange(index, 'preco', parseFloat(e.target.value) || 0)} placeholder="Preço" className="p-2 border rounded w-full md:col-span-1" />
                                <input type="number" value={planta.avaliacaoCaixa} onChange={e => handlePlantasChange(index, 'avaliacaoCaixa', parseFloat(e.target.value) || 0)} placeholder="Avaliação Caixa" className="p-2 border rounded w-full md:col-span-1" />
                                <label className="flex items-center gap-2 md:col-span-1"><input type="checkbox" checked={planta.possuiVaga} onChange={e => handlePlantasChange(index, 'possuiVaga', e.target.checked)} className="h-5 w-5 rounded text-teal-600"/> Vaga</label>
                                <button type="button" onClick={() => setPlantas(plantas.filter((_, i) => i !== index))} className="p-2 text-red-500 hover:bg-red-100 rounded-full justify-self-end md:col-span-1"><Icon name="trash" className="w-5 h-5"/></button>
                            </div>
                        ))}
                        <button type="button" onClick={() => setPlantas([...plantas, { dormitorios: '1', area: '', preco: 0, possuiVaga: false, avaliacaoCaixa: 0 }])} className="mt-2 flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-800"><Icon name="plusCircle" className="w-5 h-5"/>Adicionar Planta</button>
                    </fieldset>
                    <div className="flex gap-4 pt-4 border-t">
                        <button type="submit" disabled={isProcessing} className="w-full py-3 px-4 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 text-lg disabled:bg-slate-400"> {isProcessing ? "Processando..." : (editingImovel ? "Atualizar Empreendimento" : "Adicionar Empreendimento")} </button>
                        {editingImovel && <button type="button" onClick={() => setEditingImovel(null)} className="w-full py-3 px-4 bg-slate-200 text-slate-800 font-bold rounded-lg hover:bg-slate-300">Cancelar Edição</button>}
                    </div>
                </form>
                <div className="space-y-4">
                    {imoveis.map(imovel => (
                        <div key={imovel.id} className="bg-white/50 backdrop-blur-lg p-4 rounded-xl shadow-md flex items-center justify-between border border-white/30">
                            <div> <p className="font-bold text-lg">{imovel.nome}</p> <p className="text-sm text-slate-500">{imovel.endereco}</p> </div>
                            <div className="flex gap-2">
                                <button onClick={() => startEdit(imovel)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-full"><Icon name="edit" className="w-5 h-5"/></button>
                                <button onClick={() => handleDeleteClick(imovel.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><Icon name="trash" className="w-5 h-5"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
const CurrencyInput = ({ value, onChange, ...props }) => {
    const [displayValue, setDisplayValue] = useState('');
    const isFocused = useRef(false);

    useEffect(() => {
        if (!isFocused.current) {
            if (value !== null && value !== undefined && !isNaN(value)) {
                setDisplayValue(new Intl.NumberFormat('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(value));
            } else {
                setDisplayValue('');
            }
        }
    }, [value]);

    const handleChange = (e) => {
        const rawInput = e.target.value;
        setDisplayValue(rawInput);
        let cleanedInput = rawInput.replace(/[^0-9,]/g, ''); 
        cleanedInput = cleanedInput.replace(',', '.'); 
        const numericValue = parseFloat(cleanedInput);
        onChange(isNaN(numericValue) ? 0 : numericValue);
    };

    const handleFocus = () => {
        isFocused.current = true;
        if (value !== null && value !== undefined && !isNaN(value)) {
            setDisplayValue(value.toString().replace('.', ',')); 
        }
    };

    const handleBlur = () => {
        isFocused.current = false;
        if (value !== null && value !== undefined && !isNaN(value)) {
            setDisplayValue(new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value));
        } else {
            setDisplayValue('');
        }
    };

    return (
        <input
            type="text"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
        />
    );
};
const CaixaSimulatorModal = ({ show, onClose, allImoveis }) => {
    const [rendaBruta, setRendaBruta] = useState(0);
    const [valorImovelDesejado, setValorImovelDesejado] = useState(0);
    const [idadeProponente, setIdadeProponente] = useState(30);
    const [possuiFGTSMais36Meses, setPossuiFGTSMais36Meses] = useState(false);
    const [possuiRestricoesCPF, setPossuiRestricoesCPF] = useState(false);
    const [jaPossuiImovel, setJaPossuiImovel] = useState(false);
    const [possuiDependentes, setPossuiDependentes] = useState(false);
    const [regiao, setRegiao] = useState('Sudeste');
    const [tipoImovel, setTipoImovel] = useState('Novo');
    const [sistemaAmortizacao, setSistemaAmortizacao] = useState('SAC');

    const [resultados, setResultados] = useState(null);

    const simular = () => {
        if (rendaBruta <= 0 || valorImovelDesejado <= 0 || idadeProponente <= 0) {
            setResultados({ error: "Por favor, preencha todos os campos obrigatórios corretamente." });
            return;
        }

        const idadeMaxFinanciamento = 80;
        const prazoMaxPelaIdadeAnos = idadeMaxFinanciamento - idadeProponente;
        const prazoFinanciamentoAnos = Math.min(35, prazoMaxPelaIdadeAnos);
        const numeroParcelas = prazoFinanciamentoAnos * 12;
        const capacidadePagamentoMensal = rendaBruta * 0.3;

        let mcmvResult = {
            elegivel: false, reasonNotEligible: '', valorMaxFinanciamento: 0, entradaEstimada: 0,
            parcelaEstimada: 0, subsidioEstimado: 0, fgtsUtilizado: 0, taxaJurosAplicada: 0,
            programName: 'Minha Casa Minha Vida', faixa: '', cota: 0, simulacaoRealizada: true
        };

        if (possuiRestricoesCPF || jaPossuiImovel) {
            mcmvResult.reasonNotEligible = "Possui restrições no CPF ou já possui imóvel. Inelegível para MCMV.";
        } else if (rendaBruta > 12000) { 
            mcmvResult.reasonNotEligible = "Renda excede o limite máximo do MCMV (R$ 12.000,00).";
        } else if (valorImovelDesejado > 500000) {
             mcmvResult.reasonNotEligible = "Valor do imóvel excede o limite máximo do MCMV (R$ 500.000,00).";
        } else {
            mcmvResult.elegivel = true;
            let mcmvFaixa = null, mcmvLimiteImovelPorFaixa = 0, mcmvTaxaJurosAnual = 0, mcmvSubsidioMaxPorFaixa = 0;
            if (rendaBruta <= 2850) {
                mcmvFaixa = 'Faixa 1'; mcmvLimiteImovelPorFaixa = 264000;
                mcmvTaxaJurosAnual = (regiao === 'Norte' || regiao === 'Nordeste') ? 0.04 : 0.0425;
                mcmvSubsidioMaxPorFaixa = 55000;
            } else if (rendaBruta <= 4700) {
                mcmvFaixa = 'Faixa 2'; mcmvLimiteImovelPorFaixa = 264000;
                mcmvTaxaJurosAnual = 0.05; mcmvSubsidioMaxPorFaixa = 55000;
            } else if (rendaBruta <= 8600) {
                mcmvFaixa = 'Faixa 3'; mcmvLimiteImovelPorFaixa = 350000;
                mcmvTaxaJurosAnual = 0.06; mcmvSubsidioMaxPorFaixa = 0;
            } else if (rendaBruta <= 12000) {
                mcmvFaixa = 'Faixa 4 (Classe Média)'; mcmvLimiteImovelPorFaixa = 500000;
                mcmvTaxaJurosAnual = 0.10; mcmvSubsidioMaxPorFaixa = 0;
            }

            if (valorImovelDesejado > mcmvLimiteImovelPorFaixa) {
                mcmvResult.elegivel = false;
                mcmvResult.reasonNotEligible = `Valor do imóvel (R$ ${valorImovelDesejado.toLocaleString('pt-BR')}) excede o limite da ${mcmvFaixa} (R$ ${mcmvLimiteImovelPorFaixa.toLocaleString('pt-BR')}).`;
            } else {
                mcmvResult.faixa = mcmvFaixa; mcmvResult.taxaJurosAplicada = mcmvTaxaJurosAnual;
                mcmvResult.cota = 0.80;
                if (mcmvFaixa === 'Faixa 4 (Classe Média)' && tipoImovel === 'Usado') {
                    mcmvResult.cota = (regiao === 'Sudeste' || regiao === 'Sul') ? 0.60 : 0.80;
                }
                let valorFinanciamentoBase = valorImovelDesejado * mcmvResult.cota;
                mcmvResult.subsidioEstimado = 0;
                if (mcmvSubsidioMaxPorFaixa > 0) mcmvResult.subsidioEstimado = Math.min(mcmvSubsidioMaxPorFaixa, valorImovelDesejado * 0.2);
                if (possuiFGTSMais36Meses) mcmvResult.fgtsUtilizado = Math.min(valorImovelDesejado * 0.1, 30000);
                mcmvResult.valorMaxFinanciamento = Math.min(valorFinanciamentoBase + mcmvResult.subsidioEstimado + mcmvResult.fgtsUtilizado, valorImovelDesejado);
                mcmvResult.entradaEstimada = valorImovelDesejado - mcmvResult.valorMaxFinanciamento;
                const mcmvTaxaJurosMensal = mcmvResult.taxaJurosAplicada / 12;
                if (mcmvTaxaJurosMensal > 0 && numeroParcelas > 0) {
                    mcmvResult.parcelaEstimada = mcmvResult.valorMaxFinanciamento * (mcmvTaxaJurosMensal * Math.pow((1 + mcmvTaxaJurosMensal), numeroParcelas)) / (Math.pow((1 + mcmvTaxaJurosMensal), numeroParcelas) - 1);
                } else { mcmvResult.parcelaEstimada = mcmvResult.valorMaxFinanciamento / numeroParcelas; }
                if(mcmvResult.parcelaEstimada > capacidadePagamentoMensal) {
                    mcmvResult.elegivel = false;
                    mcmvResult.reasonNotEligible = "A parcela estimada excede sua capacidade de pagamento (30% da renda).";
                }
            }
        }

        let sbpeResult = {
            elegivel: false, reasonNotEligible: '', valorMaxFinanciamento: 0, entradaEstimada: 0,
            parcelaEstimada: 0, fgtsUtilizado: 0, taxaJurosAplicada: 0,
            programName: 'SBPE', cota: 0, simulacaoRealizada: true
        };

        if (valorImovelDesejado > 1500000) {
            sbpeResult.reasonNotEligible = "Valor do imóvel excede o limite do SBPE (R$ 1.500.000).";
        } else if (jaPossuiImovel && (valorImovelDesejado <= 1500000)) {
             sbpeResult.elegivel = true;
        } else if(possuiRestricoesCPF) {
            sbpeResult.reasonNotEligible = "Possui restrições no CPF. Pode ser inelegível para SBPE.";
        } else {
             sbpeResult.elegivel = true;
        }

        if(sbpeResult.elegivel) {
            let sbpeTaxaJurosAnual = 0;
            if (sistemaAmortizacao === 'SAC') {
                sbpeTaxaJurosAnual = 0.115; sbpeResult.cota = 0.70;
            } else {
                sbpeTaxaJurosAnual = 0.05 + 0.0459; sbpeResult.cota = 0.50;
            }
            sbpeResult.taxaJurosAplicada = sbpeTaxaJurosAnual;
            sbpeResult.valorMaxFinanciamento = valorImovelDesejado * sbpeResult.cota;
            if (possuiFGTSMais36Meses && !jaPossuiImovel) {
                sbpeResult.fgtsUtilizado = Math.min(valorImovelDesejado * 0.1, 30000);
                sbpeResult.valorMaxFinanciamento = Math.min(sbpeResult.valorMaxFinanciamento + sbpeResult.fgtsUtilizado, valorImovelDesejado);
            }
            sbpeResult.entradaEstimada = valorImovelDesejado - sbpeResult.valorMaxFinanciamento;
            const sbpeTaxaJurosMensal = sbpeResult.taxaJurosAplicada / 12;
            if (sbpeTaxaJurosMensal > 0 && numeroParcelas > 0) {
                sbpeResult.parcelaEstimada = sbpeResult.valorMaxFinanciamento * (sbpeTaxaJurosMensal * Math.pow((1 + sbpeTaxaJurosMensal), numeroParcelas)) / (Math.pow((1 + sbpeTaxaJurosMensal), numeroParcelas) - 1);
            } else { sbpeResult.parcelaEstimada = sbpeResult.valorMaxFinanciamento / numeroParcelas; }
            if(sbpeResult.parcelaEstimada > capacidadePagamentoMensal) {
                sbpeResult.elegivel = false;
                sbpeResult.reasonNotEligible = "A parcela estimada excede sua capacidade de pagamento (30% da renda).";
            }
        }
        
        let programaSugeridoTexto = "Nenhum programa aplicável para este perfil.";
        if (mcmvResult.elegivel && (!sbpeResult.elegivel || mcmvResult.parcelaEstimada < sbpeResult.parcelaEstimada)) {
            programaSugeridoTexto = mcmvResult.programName + (mcmvResult.faixa ? ` (${mcmvResult.faixa})` : '');
        } else if (sbpeResult.elegivel) {
            programaSugeridoTexto = sbpeResult.programName;
        }

        const finalProgramNameForFilter = (mcmvResult.elegivel && (!sbpeResult.elegivel || mcmvResult.parcelaEstimada < sbpeResult.parcelaEstimada)) 
            ? mcmvResult.programName 
            : (sbpeResult.elegivel ? sbpeResult.programName : null);
        
        let empreendimentosRecomendados = allImoveis.filter(imovel => {
            const imovelValor = imovel.valorAPartir || 0;
            if (finalProgramNameForFilter && finalProgramNameForFilter.includes('Minha Casa Minha Vida')) {
                let limite = 0;
                if (rendaBruta <= 2850) limite = 264000;
                else if (rendaBruta <= 8600) limite = 350000;
                else if (rendaBruta <= 12000) limite = 500000;
                return imovelValor <= limite;
            }
            if (finalProgramNameForFilter === 'SBPE') return imovelValor <= 1500000;
            return false;
        }).filter(imovel => imovel.valorAPartir <= valorImovelDesejado).slice(0, 5);

        setResultados({
            mcmv: mcmvResult, sbpe: sbpeResult, programaSugeridoTexto,
            prazoFinanciamentoAnos, numeroParcelas, capacidadePagamentoMensal,
            empreendimentosRecomendados, error: null
        });
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl overflow-y-auto max-h-[90vh]">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex justify-between items-center">
                    Simulador Caixa (Simplificado)
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><Icon name="x" className="w-5 h-5 text-slate-500"/></button>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Renda Bruta</label>
                        <CurrencyInput value={rendaBruta} onChange={setRendaBruta} className="p-2 border rounded-lg w-full" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Valor do Imóvel</label>
                        <CurrencyInput value={valorImovelDesejado} onChange={setValorImovelDesejado} className="p-2 border rounded-lg w-full" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Idade Proponente</label>
                        <input type="number" value={idadeProponente} onChange={(e) => setIdadeProponente(Number(e.target.value))} className="p-2 border rounded-lg w-full" required />
                    </div>
                </div>
                <button onClick={simular} className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700">Simular</button>

                {resultados && (
                    <div className="mt-6 border-t pt-6">
                        <h4 className="text-lg font-bold text-slate-800 mb-3">Resultados:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-lg border shadow-sm ${resultados.mcmv.elegivel ? 'border-green-500' : 'border-red-500'}`}>
                                <h5 className="font-bold text-lg mb-2 text-teal-700">Minha Casa Minha Vida {resultados.mcmv.faixa && `(${resultados.mcmv.faixa})`}</h5>
                                {resultados.mcmv.elegivel ? (
                                    <ul className="space-y-1 text-slate-700 text-sm">
                                        <li className="flex justify-between"><span>Elegível:</span> <span className="font-semibold text-green-600">Sim</span></li>
                                        <li className="flex justify-between"><span>Valor Máx. Financiável:</span> <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultados.mcmv.valorMaxFinanciamento)}</span></li>
                                        <li className="flex justify-between"><span>Entrada Estimada:</span> <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultados.mcmv.entradaEstimada)}</span></li>
                                        <li className="flex justify-between"><span>Subsídio Estimado:</span> <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultados.mcmv.subsidioEstimado)}</span></li>
                                        <li className="flex justify-between"><span>Parcela Mensal Estimada:</span> <span className="font-semibold text-teal-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultados.mcmv.parcelaEstimada)}</span></li>
                                    </ul>
                                ) : <p className="text-red-600 text-sm">{resultados.mcmv.reasonNotEligible}</p>}
                            </div>
                            <div className={`p-4 rounded-lg border shadow-sm ${resultados.sbpe.elegivel ? 'border-green-500' : 'border-red-500'}`}>
                                <h5 className="font-bold text-lg mb-2 text-teal-700">SBPE</h5>
                                {resultados.sbpe.elegivel ? (
                                     <ul className="space-y-1 text-slate-700 text-sm">
                                        <li className="flex justify-between"><span>Elegível:</span> <span className="font-semibold text-green-600">Sim</span></li>
                                        <li className="flex justify-between"><span>Valor Máx. Financiável:</span> <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultados.sbpe.valorMaxFinanciamento)}</span></li>
                                        <li className="flex justify-between"><span>Entrada Estimada:</span> <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultados.sbpe.entradaEstimada)}</span></li>
                                        <li className="flex justify-between"><span>Parcela Mensal Estimada:</span> <span className="font-semibold text-teal-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultados.sbpe.parcelaEstimada)}</span></li>
                                    </ul>
                                ) : <p className="text-red-600 text-sm">{resultados.sbpe.reasonNotEligible}</p>}
                            </div>
                        </div>
                        <div className="mt-6 p-4 bg-teal-50 rounded-lg text-teal-800 text-center font-semibold border border-teal-600">
                            <span className="font-bold">Programa Sugerido: {resultados.programaSugeridoTexto}</span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-800 mt-6 mb-3">Empreendimentos que podem se encaixar:</h4>
                        {resultados.empreendimentosRecomendados.length > 0 ? (
                            <ul className="space-y-2">
                                {resultados.empreendimentosRecomendados.map(imovel => (
                                    <li key={imovel.id} className="p-3 bg-slate-50 rounded-md flex justify-between items-center text-sm">
                                        <span>{imovel.nome}</span>
                                        <span className="font-semibold text-teal-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.valorAPartir || 0)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-slate-500">Nenhum empreendimento em estoque se encaixa nesses critérios.</p>}
                    </div>
                )}
            </div>
        </div>
    );
};
const SimuladorPage = ({ allImoveis }) => {
    const [showSimulatorModal, setShowSimulatorModal] = useState(false);
    return (
        <div className="py-10">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Simulador de Financiamento</h1>
            <div className="bg-white/50 backdrop-blur-lg p-8 rounded-xl shadow-lg border border-white/30 text-center">
                <p className="text-lg text-slate-600 mb-6">Utilize o simulador para estimar as condições de financiamento.</p>
                <button onClick={() => setShowSimulatorModal(true)} className="bg-teal-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-700 flex items-center justify-center mx-auto gap-2">
                    <Icon name="calculator" className="w-6 h-6"/> Abrir Simulador
                </button>
            </div>
            <CaixaSimulatorModal show={showSimulatorModal} onClose={() => setShowSimulatorModal(false)} allImoveis={allImoveis} />
        </div>
    );
};

// ... (Restante dos componentes)

const TabelaEstoquePage = ({ imoveis, onViewDetails, onCompare }) => {
    // ... (lógica interna do componente mantida)
    const [currentFilters, setCurrentFilters] = useState({ 
        searchTerm: '', status: '', regiao: '', supervisor: '', posChaves: false, 
        valorMin: 0, valorMax: 0, dorms: [], vaga: 'indiferente', dataEntrega: ''
    });
    const [appliedFilters, setAppliedFilters] = useState(currentFilters);
    const [sortConfig, setSortConfig] = useState({ key: 'dataEntrega', direction: 'ascending' });
    const [selectedToCompare, setSelectedToCompare] = useState([]);


    const supervisors = [...new Set(imoveis.map(i => i.supervisor).filter(Boolean))];
    
    const deliveryDates = useMemo(() => {
        const dates = [...new Set(imoveis.map(i => i.dataEntrega).filter(Boolean))];
        return dates.sort((a, b) => parseDateForSort(a) - parseDateForSort(b));
    }, [imoveis]);


    const handleDormFilterChange = (dorm) => {
        setCurrentFilters(prev => ({
            ...prev,
            dorms: prev.dorms.includes(dorm) 
                ? prev.dorms.filter(d => d !== dorm) 
                : [...prev.dorms, dorm]
        }));
    };

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const applyFilters = () => {
        setAppliedFilters(currentFilters);
    };

    const sortedAndFilteredImoveis = useMemo(() => {
        let filtered = imoveis.filter(imovel => {
            const imovelValor = parseFloat(imovel.valorAPartir);

            const matchesValor = (!appliedFilters.valorMin || imovelValor >= appliedFilters.valorMin) && (!appliedFilters.valorMax || appliedFilters.valorMax === 0 || imovelValor <= appliedFilters.valorMax);
            
            const hasSelectedDorm = appliedFilters.dorms.length === 0 || 
                                        (imovel.plantas && imovel.plantas.some(planta => appliedFilters.dorms.includes(planta.dormitorios)));
            
            const filterDateNum = parseDateForSort(appliedFilters.dataEntrega);
            const imovelDateNum = parseDateForSort(imovel.dataEntrega);

            const matchesDate = !appliedFilters.dataEntrega || imovel.status === 'Pronto para Morar' || imovelDateNum <= filterDateNum;

            const matchesVaga = appliedFilters.vaga === 'indiferente' || 
                              (imovel.plantas && imovel.plantas.some(planta => 
                                  appliedFilters.vaga === 'com' ? planta.possuiVaga : !planta.possuiVaga
                              ));

            return (appliedFilters.searchTerm === '' || imovel.nome.toLowerCase().includes(appliedFilters.searchTerm.toLowerCase())) &&
                   (appliedFilters.status === '' || imovel.status === appliedFilters.status) &&
                   (appliedFilters.regiao === '' || imovel.regiao === appliedFilters.regiao) &&
                   (appliedFilters.supervisor === '' || imovel.supervisor === appliedFilters.supervisor) &&
                   (!appliedFilters.posChaves || (imovel.condicoes && imovel.condicoes.posChaves)) &&
                   matchesValor &&
                   hasSelectedDorm &&
                   matchesDate &&
                   matchesVaga;
        });

        if (sortConfig.key) {
            filtered.sort((a, b) => {
                let aValue, bValue;
                if (sortConfig.key === 'dataEntrega') {
                    aValue = parseDateForSort(a.dataEntrega);
                    bValue = parseDateForSort(b.dataEntrega);
                } else {
                    aValue = parseFloat(a[sortConfig.key] || 0);
                    bValue = parseFloat(b[sortConfig.key] || 0);
                }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [imoveis, appliedFilters, sortConfig]);

    const SortableHeader = ({ label, sortKey, className = '' }) => {
        const isSorted = sortConfig.key === sortKey;
        return (
            <th className={`p-4 font-semibold cursor-pointer ${className}`} onClick={() => requestSort(sortKey)}>
                <div className="flex items-center gap-1">
                    {label}
                    {isSorted ? (sortConfig.direction === 'ascending' ? <Icon name="chevronUp" className="w-4 h-4" /> : <Icon name="chevronDown" className="w-4 h-4" />) : null}
                </div>
            </th>
        );
    };

    return (
        <div className="py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Tabela de Empreendimentos</h1>
                <div className="flex gap-4">
                    {selectedToCompare.length > 1 && (
                        <button onClick={() => onCompare(selectedToCompare)} className="bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors">Comparar ({selectedToCompare.length})</button>
                    )}
                </div>
            </div>
            {/* FILTROS */}
            <div className="mb-8 p-6 bg-white/50 backdrop-blur-lg rounded-xl shadow-lg border border-white/30 space-y-6">
                 <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-3">Pesquisa Geral</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input type="text" placeholder="Pesquisar por nome..." className="p-3 border rounded-lg w-full" value={currentFilters.searchTerm} onChange={(e) => setCurrentFilters({...currentFilters, searchTerm: e.target.value})} />
                        <select className="p-3 border rounded-lg w-full" value={currentFilters.status} onChange={(e) => setCurrentFilters({...currentFilters, status: e.target.value})}>
                            <option value="">Todos os Status</option><option>Lançamento</option><option>Em Obras</option><option>Pronto para Morar</option>
                        </select>
                        <select className="p-3 border rounded-lg w-full" value={currentFilters.regiao} onChange={(e) => setCurrentFilters({...currentFilters, regiao: e.target.value})}>
                            <option value="">Todas as Regiões</option><option>Zona Norte</option><option>Zona Sul</option><option>Zona Leste</option><option>Zona Oeste</option>
                        </select>
                        <select className="p-3 border rounded-lg w-full" value={currentFilters.supervisor} onChange={(e) => setCurrentFilters({...currentFilters, supervisor: e.target.value})}>
                            <option value="">Todos os Supervisores</option>
                            {supervisors.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200/80">
                    <div className="lg:col-span-2">
                        <h3 className="text-lg font-semibold text-slate-700 mb-3">Faixa de Valor</h3>
                        <div className="grid grid-cols-2 gap-4">
                             <CurrencyInput placeholder="Valor Mínimo" className="p-3 border rounded-lg w-full" value={currentFilters.valorMin} onChange={value => setCurrentFilters({...currentFilters, valorMin: value})} />
                             <CurrencyInput placeholder="Valor Máximo" className="p-3 border rounded-lg w-full" value={currentFilters.valorMax} onChange={value => setCurrentFilters({...currentFilters, valorMax: value})} />
                        </div>
                    </div>
                    <div className="lg:col-span-2">
                         <h3 className="text-lg font-semibold text-slate-700 mb-3">Entrega</h3>
                         <select className="p-3 border rounded-lg w-full" value={currentFilters.dataEntrega} onChange={(e) => setCurrentFilters({...currentFilters, dataEntrega: e.target.value})}>
                            <option value="">Entrega até (Todos)</option>
                            {deliveryDates.map(date => <option key={date} value={date}>{date}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-4 border-t border-slate-200/80">
                    <h3 className="text-lg font-semibold text-slate-700 w-full md:w-auto mb-3 md:mb-0">Opções das Plantas</h3>
                    <div className="flex items-center gap-4">
                        <span className="font-medium text-sm text-slate-600">Dorms:</span>
                        {['1', '2', '3'].map(dorm => (
                            <label key={dorm} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={currentFilters.dorms.includes(dorm)} onChange={() => handleDormFilterChange(dorm)} className="h-5 w-5 rounded text-teal-600 focus:ring-teal-500" /> {dorm}
                            </label>
                        ))}
                    </div>
                     <div className="flex items-center gap-4">
                        <span className="font-medium text-sm text-slate-600">Vaga:</span>
                         <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="vaga" checked={currentFilters.vaga === 'indiferente'} onChange={() => setCurrentFilters({...currentFilters, vaga: 'indiferente'})} /> Indiferente</label>
                         <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="vaga" checked={currentFilters.vaga === 'com'} onChange={() => setCurrentFilters({...currentFilters, vaga: 'com'})} /> Com</label>
                         <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="vaga" checked={currentFilters.vaga === 'sem'} onChange={() => setCurrentFilters({...currentFilters, vaga: 'sem'})} /> Sem</label>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer md:ml-auto">
                        <input type="checkbox" checked={currentFilters.posChaves} onChange={e => setCurrentFilters({...currentFilters, posChaves: e.target.checked})} className="h-5 w-5 rounded text-teal-600 focus:ring-teal-500" /> Pós Chaves
                    </label>
                </div>
                <div className="pt-4 border-t">
                    <button type="button" onClick={applyFilters} className="w-full py-3 px-4 bg-teal-600 text-white font-bold rounded-lg hover:bg-teal-700 transition-colors">Aplicar Filtros</button>
                </div>
            </div>
            {/* TABELA */}
            <div className="bg-white/50 backdrop-blur-lg rounded-xl shadow-lg border border-white/30 overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-100/70">
                        <tr>
                            <th className="p-4 font-semibold">Comparar</th>
                            <th className="p-4 font-semibold">Empreendimento</th>
                            <SortableHeader label="Valor a partir de" sortKey="valorAPartir" />
                            <th className="p-4 font-semibold">Plantas</th>
                            <SortableHeader label="Data Entrega" sortKey="dataEntrega" />
                            <th className="p-4 font-semibold text-center">Pós-Chaves</th>
                            <th className="p-4 font-semibold">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredImoveis.map(imovel => (
                            <tr key={imovel.id} className="border-b border-slate-200/80 hover:bg-slate-50/50">
                                <td className="p-4 text-center"><input type="checkbox" className="h-5 w-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500" checked={selectedToCompare.includes(imovel.id)} onChange={() => setSelectedToCompare(prev => prev.includes(imovel.id) ? prev.filter(id => id !== imovel.id) : [...prev, imovel.id])} /></td>
                                <td className="p-4 font-medium">{imovel.nome}<p className="text-xs text-slate-500">{imovel.regiao}</p></td>
                                <td className="p-4 font-medium text-teal-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.valorAPartir || 0)}</td>
                                <td className="p-4 text-sm">{imovel.plantas && imovel.plantas.length > 0 ? imovel.plantas.map(p => `${p.dormitorios}D (${p.area})`).join(' / ') : 'N/A'}</td>
                                <td className="p-4">{imovel.dataEntrega}</td>
                                <td className="p-4 text-center"><div title="Pós Chaves">{imovel.condicoes?.posChaves ? <Icon name="checkCircle" className="w-5 h-5 text-green-500 mx-auto"/> : <Icon name="xCircle" className="w-5 h-5 text-slate-400 mx-auto"/>}</div></td>
                                <td className="p-4"><button onClick={() => onViewDetails(imovel, 'tabelas')} className="bg-teal-500 text-white text-sm font-semibold py-1 px-3 rounded-lg hover:bg-teal-600">Ver Detalhes</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {sortedAndFilteredImoveis.length === 0 && <div className="text-center p-8"><p className="text-slate-500">Nenhum empreendimento encontrado com os filtros aplicados.</p></div>}
            </div>
        </div>
    );
};

const MapaPage = ({ imoveis, onViewDetails, isMapsApiLoaded, mapsApiError }) => {
    const mapRef = useRef(null);
    useEffect(() => {
        if (!isMapsApiLoaded || !mapRef.current || !window.google) return;
        const map = new window.google.maps.Map(mapRef.current, { center: { lat: -23.55, lng: -46.63 }, zoom: 11 });
        const infoWindow = new window.google.maps.InfoWindow();
        imoveis.forEach(imovel => {
            if (imovel.coordinates) {
                const marker = new window.google.maps.Marker({ position: imovel.coordinates, map, title: imovel.nome });
                marker.addListener('click', () => {
                    const contentString = `<div class="p-2"><h3 class="font-bold">${imovel.nome}</h3><button id="infoBtn-${imovel.id}" class="text-teal-500">Ver Detalhes</button></div>`;
                    infoWindow.setContent(contentString);
                    infoWindow.open(map, marker);
                    google.maps.event.addListenerOnce(infoWindow, 'domready', () => {
                        document.getElementById(`infoBtn-${imovel.id}`).addEventListener('click', () => onViewDetails(imovel, 'mapa'));
                    });
                });
            }
        });
    }, [isMapsApiLoaded, imoveis, onViewDetails]);

    if (mapsApiError) return <GoogleApiError />;
    if (!isMapsApiLoaded) return <div className="p-10 text-center">A carregar mapa...</div>;
    return (
        <div className="py-10">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Mapa de Empreendimentos</h1>
            <div ref={mapRef} style={{ height: '70vh' }} className="w-full rounded-xl shadow-lg border"></div>
        </div>
    );
};
const ConfirmationModal = ({ show, onClose, onConfirm, title, message }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{message}</p>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Confirmar</button>
                </div>
            </div>
        </div>
    );
};
const Notification = ({ message, type, show }) => {
    if (!show) return null;
    const style = type === 'success' ? 'bg-teal-500' : 'bg-red-500';
    return <div className={`fixed top-5 right-5 ${style} text-white px-6 py-3 rounded-lg shadow-lg z-50`}>{message}</div>;
};
const GoogleApiError = () => (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-lg my-6" role="alert">
         <div className="flex">
            <div className="py-1"><Icon name="alertTriangle" className="w-6 h-6 text-red-500 mr-4"/></div>
            <div>
                <p className="font-bold">Ação Necessária: Ative as APIs do Google Maps</p>
                <p className="text-sm mt-2">Por favor, verifique no seu <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">Painel do Google Cloud</a> se as seguintes APIs estão <strong>ATIVADAS</strong>: Maps JavaScript API, Geocoding API, Places API.</p>
            </div>
        </div>
    </div>
);
const DatabaseErrorBanner = () => (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-lg my-6" role="alert">
        <div className="flex">
            <div className="py-1"><Icon name="alertTriangle" className="w-6 h-6 text-red-500 mr-4"/></div>
            <div>
                 <p className="font-bold">Erro de Permissão no Banco de Dados</p>
                 <p className="text-sm mt-2">A aplicação não conseguiu ler os dados. Verifique as <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/database/rules`} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline">regras de segurança</a> do seu banco de dados.</p>
            </div>
        </div>
    </div>
);
const PlaceholderSection = ({ title }) => ( <div className="py-20 text-center"> <h2 className="text-2xl font-bold text-slate-800">{title}</h2> <p className="text-slate-500 mt-2">Esta seção está em desenvolvimento.</p> </div> );
const Footer = ({ user, setActivePage }) => (
    <footer className="bg-slate-800 text-white mt-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            <p className="font-semibold text-lg">Vivaz Equipe Murilo</p>
            <p className="text-slate-400 mt-2">&copy; {new Date().getFullYear()}. O portal da sua equipe.</p>
            {!user && <button onClick={() => setActivePage('login')} className="text-sm text-slate-500 hover:text-teal-400 mt-4">Acesso Restrito</button>}
        </div>
    </footer>
);

// =================================================================================
// COMPONENTE PRINCIPAL DA APLICAÇÃO
// =================================================================================
export default function App() {
    useScript(`https://maps.googleapis.com/maps/api/js?key=${Maps_API_KEY}&libraries=places,maps&callback=initMap`, 'initMap');

    const [activePage, setActivePage] = useState('inicio');
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState('public');
    const [loading, setLoading] = useState(true);
    const [imoveis, setImoveis] = useState([]);
    const [selectedImovel, setSelectedImovel] = useState(null);
    const [selectedToCompare, setSelectedToCompare] = useState([]);
    const [isMapsApiLoaded, setIsMapsApiLoaded] = useState(false);
    const [mapsApiError, setMapsApiError] = useState(false);
    const [databaseError, setDatabaseError] = useState(false);
    const [previousPage, setPreviousPage] = useState('inicio');
    const [newsArticles, setNewsArticles] = useState([]);
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    const fetchMockNews = () => {
        const mockNewsData = [
            { id: `news-${Date.now()}-1`, title: 'Confiança da construção sobe em junho e atinge maior nível em 11 meses, diz FGV', source: 'InfoMoney', date: '25 de Jun, 2025', url: 'https://www.infomoney.com.br/economia/confianca-da-construcao-sobe-em-junho-e-atinge-maior-nivel-em-11-meses-diz-fgv/', imageUrl: 'https://placehold.co/400x200/e0e0e0/555555?text=Noticia+1' },
            { id: `news-${Date.now()}-2`, title: 'Preço dos aluguéis residenciais sobe 1,48% em maio, aponta FipeZap+', source: 'Exame', date: '24 de Jun, 2025', url: 'https://exame.com/invest/mercado-imobiliario/preco-dos-aluguies-residenciais-sobe-1-48-em-maio-aponta-fipezap/', imageUrl: 'https://placehold.co/400x200/d0d0d0/666666?text=Noticia+2' },
            { id: `news-${Date.now()}-3`, title: 'Caixa anuncia R$ 8,7 bilhões para o novo Minha Casa, Minha Vida', source: 'Valor Econômico', date: '22 de Jun, 2025', url: 'https://valor.globo.com/financas/noticia/2023/07/19/caixa-anuncia-r-87-bilhoes-para-o-novo-minha-casa-minha-vida.ghtml', imageUrl: 'https://placehold.co/400x200/c0c0c0/777777?text=Noticia+3' },
        ];
        setNewsArticles(mockNewsData);
    };

    useEffect(() => {
        const init = async () => {
            window.gm_authFailure = () => setMapsApiError(true);
            window.initMap = () => setIsMapsApiLoaded(true);

            const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
                if (currentUser && !currentUser.isAnonymous) {
                    setUser(currentUser);
                    setUserRole('admin');
                    setActivePage(prev => prev === 'login' ? 'adminDashboard' : prev);
                } else {
                    setUser(null);
                    setUserRole('public');
                }
            });

            try {
                if (!auth.currentUser) {
                    await signInAnonymously(auth);
                }
            } catch (err) {
                console.error("Anonymous sign-in failed:", err);
                setDatabaseError(true); setLoading(false);
                return () => unsubscribeAuth();
            }

            const imoveisRef = dbRef(db, 'imoveis');
            const unsubscribeRTDB = onValue(imoveisRef, (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const imoveisList = Object.keys(data).map(key => {
                        const imovel = { id: key, ...data[key] };
                        if (imovel.plantas && Array.isArray(imovel.plantas)) {
                            const precos = imovel.plantas.map(p => p.preco).filter(p => p > 0);
                            imovel.valorAPartir = precos.length > 0 ? Math.min(...precos) : 0;
                        } else {
                            imovel.valorAPartir = 0;
                        }
                        return imovel;
                    });
                    setImoveis(imoveisList);
                } else {
                    setImoveis([]);
                }
                setLoading(false);
            }, (error) => {
                console.error("Erro no listener do Realtime Database: ", error);
                if (error.code === 'PERMISSION_DENIED') setDatabaseError(true);
                setLoading(false);
            });

            fetchMockNews();
            const newsInterval = setInterval(fetchMockNews, 3600000);


            return () => { 
                unsubscribeAuth(); 
                unsubscribeRTDB(); 
                clearInterval(newsInterval);
            };
        };
        let cleanup = () => {};
        init().then(returnedCleanup => { if (returnedCleanup) cleanup = returnedCleanup; });
        return () => {
            cleanup();
            delete window.gm_authFailure; delete window.initMap;
        };
    }, []);

    const destaques = useMemo(() => {
        return imoveis
            .filter(imovel => imovel.status === 'Lançamento')
            .sort((a, b) => parseDateForSort(b.dataEntrega) - parseDateForSort(a.dataEntrega))
            .slice(0, 3);
    }, [imoveis]);

    const latestNewsForSection = useMemo(() => {
        return newsArticles.slice(0, 3);
    }, [newsArticles]);

    const handleLoginSuccess = () => {
        console.log("Login bem-sucedido, aguardando redirecionamento...");
    };

    const handleLogout = async () => { 
        try { await signOut(auth); setActivePage('inicio'); await signInAnonymously(auth); } 
        catch (error) { console.error("Erro ao sair:", error); } 
    };
    const handleViewDetails = (imovel, fromPage) => { 
        setPreviousPage(fromPage);
        setSelectedImovel(imovel); 
        setActivePage('detalheImovel'); 
    };
    const handleCompare = (imovelIds) => { setSelectedToCompare(imovelIds); setActivePage('comparativo'); };
    const handleGoBack = () => setActivePage(previousPage);

    const renderPage = () => {
        if (loading) { return <div className="flex items-center justify-center h-screen"><div className="text-xl font-semibold text-slate-600">Carregando Portal...</div></div>; }
        if (databaseError) return <DatabaseErrorBanner />;

        if (activePage === 'login') return <AuthPage onLoginSuccess={handleLoginSuccess} setActivePage={setActivePage}/>;
        
        if (activePage === 'adminDashboard') {
            return userRole === 'admin' 
                ? <AdminDashboard databaseError={databaseError} mapsApiError={mapsApiError} isMapsApiLoaded={isMapsApiLoaded} imoveis={imoveis} onLogout={handleLogout} setActivePage={setActivePage} />
                : <AuthPage onLoginSuccess={handleLoginSuccess} setActivePage={setActivePage}/>;
        }
        
        if (activePage === 'detalheImovel') return <DetalheImovelPage imovel={selectedImovel} onBack={handleGoBack} allImoveis={imoveis} />;
        if (activePage === 'comparativo') return <ComparativoPage imoveis={selectedToCompare} allImoveis={imoveis} setActivePage={setActivePage} />;


        switch (activePage) {
            case 'inicio': return ( <> <NewsSection setActivePage={setActivePage} latestNews={latestNewsForSection} /> <LancamentosSection imoveis={destaques} onViewDetails={handleViewDetails}/> </> );
            case 'mapa': return <MapaPage imoveis={imoveis} onViewDetails={handleViewDetails} isMapsApiLoaded={isMapsApiLoaded} mapsApiError={mapsApiError} />;
            case 'tabelas': return <TabelaEstoquePage imoveis={imoveis} onViewDetails={handleViewDetails} onCompare={handleCompare} />;
            case 'simulador': return <SimuladorPage allImoveis={imoveis} />;
            case 'comissoes': return <PlaceholderSection title="Comissões e Premiações" />;
            case 'documentacao': return <PlaceholderSection title="Documentação" />;
            case 'noticias': return <NewsPage allNews={newsArticles} />;
            case 'agendamentos': return <AgendamentosPage userRole={userRole} />;
            default: return <NewsSection setActivePage={setActivePage} latestNews={latestNewsForSection} />;
        }
    };

    return (
        <div className="flex min-h-screen font-sans bg-slate-100">
            <Sidebar 
                isSidebarOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
                user={user}
                userRole={userRole}
                activePage={activePage}
                setActivePage={setActivePage}
                onLogout={handleLogout}
            />
            <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>
                <main className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                    {renderPage()}
                </main>
                <Footer user={user} setActivePage={setActivePage} />
            </div>
        </div>
    );
}
const ComparativoPage = ({ imoveis, allImoveis, setActivePage }) => {
    const imoveisSelecionados = allImoveis.filter(imovel => imoveis.includes(imovel.id));
    
    // Function to render a generic field row
    const renderField = (label, key) => (
        <tr className="border-b">
            <td className="p-3 font-semibold bg-slate-50 text-slate-700">{label}</td>
            {imoveisSelecionados.map(imovel => (
                <td key={imovel.id} className="p-3">{imovel[key] || 'N/A'}</td>
            ))}
        </tr>
    );

    // Function to render conditions with smart identifier
    const renderCondicoes = () => (
        <tr className="border-b">
             <td className="p-3 font-semibold bg-slate-50 align-top">Condições</td>
             {imoveisSelecionados.map(imovel => {
                const isBestCondition = imovel.condicoes?.itbiRegistroGratis && imovel.condicoes?.posChaves;
                return (
                 <td key={imovel.id} className="p-3 align-top">
                       <ul className="space-y-1">
                           <li className="flex items-center gap-2">{imovel.condicoes?.itbiRegistroGratis ? <Icon name="checkCircle" className="w-5 h-5 text-green-500"/> : <Icon name="xCircle" className="w-5 h-5 text-slate-400"/>} ITBI Grátis</li>
                           <li className="flex items-center gap-2">{imovel.condicoes?.posChaves ? <Icon name="checkCircle" className="w-5 h-5 text-green-500"/> : <Icon name="xCircle" className="w-5 h-5 text-slate-400"/>} Pós Chaves</li>
                           {isBestCondition && (
                                <li className="mt-2 flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                                    <Icon name="checkCircle" className="w-3 h-3 fill-current text-blue-500"/> Melhores Condições
                                </li>
                           )}
                       </ul>
                 </td>
                );
             })}
        </tr>
    );

    // Function to render available plants
    const renderPlantas = () => {
        // Encontrar o número máximo de plantas entre os imóveis selecionados para garantir que todas as linhas sejam preenchidas
        const maxPlantas = Math.max(...imoveisSelecionados.map(imovel => imovel.plantas?.length || 0));
        
        // Se não houver plantas em nenhum imóvel, não renderiza a seção de plantas
        if (maxPlantas === 0) {
            return (
                <tr className="border-b">
                    <td className="p-3 font-semibold bg-slate-50 text-slate-700 align-top">Plantas</td>
                    {imoveisSelecionados.map(imovel => (
                        <td key={imovel.id} className="p-3 text-slate-500">Nenhuma planta cadastrada.</td>
                    ))}
                </tr>
            );
        }

        // Gera as linhas para cada planta, garantindo que imóveis com menos plantas mostrem 'N/A'
        return Array.from({ length: maxPlantas }).map((_, plantaIndex) => (
            <tr key={`plantas-row-${plantaIndex}`} className="border-b">
                {plantaIndex === 0 && <td rowSpan={maxPlantas} className="p-3 font-semibold bg-slate-50 text-slate-700 align-top">Plantas</td>}
                {imoveisSelecionados.map(imovel => {
                    const planta = imovel.plantas?.[plantaIndex];
                    return (
                        <td key={`${imovel.id}-planta-${plantaIndex}`} className="p-3 align-top">
                            {planta ? (
                                <ul className="space-y-1 text-sm">
                                    <li><strong>Dorms:</strong> {planta.dormitorios}</li>
                                    <li><strong>Área:</strong> {planta.area}</li>
                                    <li><strong>Preço:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(planta.preco || 0)}</li>
                                    <li>
                                        <strong>Vaga:</strong> {planta.possuiVaga ? <Icon name="checkCircle" className="w-5 h-5 inline-block text-green-500"/> : <Icon name="xCircle" className="w-5 h-5 inline-block text-slate-400"/>}
                                    </li>
                                    <li><strong>Avaliação Caixa:</strong> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(planta.avaliacaoCaixa || 0)}</li>
                                </ul>
                            ) : (
                                <p className="text-slate-500">N/A</p>
                            )}
                        </td>
                    );
                })}
            </tr>
        ));
    };

    return (
        <div className="py-10">
            <button onClick={() => setActivePage('tabelas')} className="mb-8 flex items-center gap-2 text-slate-600 font-semibold hover:text-teal-600">
                <Icon name="arrowLeft" className="w-5 h-5"/>
                Voltar para Tabela
            </button>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Comparativo de Empreendimentos</h1>
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-teal-600 text-white">
                        <tr>
                            <th className="p-4 font-semibold">Característica</th>
                            {imoveisSelecionados.map(imovel => <th key={imovel.id} className="p-4 font-semibold">{imovel.nome}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {renderField("Status", "status")}
                        {renderField("Região", "regiao")}
                        {renderField("Data de Entrega", "dataEntrega")}
                        {renderField("Supervisor", "supervisor")}
                        {renderField("Pró-Soluto", "proSoluto")}
                        {renderCondicoes()}
                        {renderPlantas()}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
