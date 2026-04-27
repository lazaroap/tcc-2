import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-black text-gray-200 select-none">404</p>
        <h1 className="text-2xl font-bold text-gray-700 mt-2">
          Página não encontrada
        </h1>
        <p className="text-gray-400 mt-2 text-sm">
          A página que voce está procurando não existe ou foi removida.
        </p>
        <Link
          to="/dashboard"
          className="inline-block mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition text-sm"
        >
          Voltar ao inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
