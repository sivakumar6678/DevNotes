import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import About from './pages/About'
import Categories from './pages/Categories'
import Home from './pages/Home'
import NotePage from './pages/NotePage'
import NotFound from './pages/NotFound'
import Technologies from './pages/Technologies'
import Topics from './pages/Topics'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="categories" element={<Categories />} />
          <Route path="technologies" element={<Technologies />} />
          <Route path="topics/:tech_slug" element={<Topics />} />
          <Route path="notes/:slug" element={<NotePage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
