/* Main App Component - Handles routing, context and providers */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from './context/AppContext'
import Layout from './components/Layout'

// Pages
import Index from './pages/Index'
import Acesso from './pages/Acesso'
import Autenticar from './pages/Autenticar'
import Empresas from './pages/Empresas'
import Inicio from './pages/Inicio'
import Perfil from './pages/Perfil'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />
            <Route path="/acesso" element={<Acesso />} />
            <Route path="/autenticar" element={<Autenticar />} />
            <Route path="/empresas" element={<Empresas />} />
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AppProvider>
  </BrowserRouter>
)

export default App
