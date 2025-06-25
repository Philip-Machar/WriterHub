import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import Submit from "./pages/Submit";
import PrivateRoute from "./components/PrivateRoute";
import GigDetails from "./pages/GigDetails";
import About from "./pages/About";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        } />

        <Route path="/submit/:id" element={
          <PrivateRoute>
            <Submit />
          </PrivateRoute>
        } />

        <Route path="/admin" element={
          <PrivateRoute adminOnly={true}>
            <Admin />
          </PrivateRoute>
        } />

        <Route path="/gig/:id" element={
          <PrivateRoute>
            <GigDetails />
          </PrivateRoute>
        } />

        <Route path="/about" element={<About />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
