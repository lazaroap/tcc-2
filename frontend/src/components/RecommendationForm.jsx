import { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

const RecommendationForm = ({ groupId, categories, onSuccess, onCancel }) => {
  const [recForm, setRecForm] = useState({ title: "", description: "" });
  const [recMode, setRecMode] = useState("search");
  const [providerSearch, setProviderSearch] = useState("");
  const [providerResults, setProviderResults] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [searchingProvider, setSearchingProvider] = useState(false);
  const [externalForm, setExternalForm] = useState({
    name: "",
    category: "",
    phone: "",
  });
  const [submittingRec, setSubmittingRec] = useState(false);

  useEffect(() => {
    if (providerSearch.length < 2) {
      setProviderResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchingProvider(true);
      try {
        const res = await api.get("/providers/search", {
          params: { q: providerSearch },
        });
        setProviderResults(res.data.providers || []);
      } catch {
        setProviderResults([]);
      } finally {
        setSearchingProvider(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [providerSearch]);

  const handleCreateRec = async (e) => {
    e.preventDefault();
    if (recMode === "search" && !selectedProvider) {
      return toast.error("Selecione um prestador");
    }
    if (recMode === "external" && (!externalForm.name || !externalForm.phone)) {
      return toast.error("Nome e telefone do prestador sao obrigatórios");
    }

    setSubmittingRec(true);
    try {
      const body = { title: recForm.title, description: recForm.description };
      if (recMode === "search") {
        body.providerId = selectedProvider.id;
      } else {
        body.externalName = externalForm.name;
        body.externalCategory = externalForm.category;
        body.externalPhone = externalForm.phone;
      }

      await api.post(`/groups/${groupId}/recommendations`, body);
      toast.success("Recomendação criada!");
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || "Erro ao criar recomendação");
    } finally {
      setSubmittingRec(false);
    }
  };

  return (
    <form
      onSubmit={handleCreateRec}
      className="bg-white rounded-xl border border-gray-200 p-6 mb-4"
    >
      <h3 className="text-lg font-semibold text-gray-700 mb-4">
        Nova recomendacao
      </h3>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Titulo (ex: Recomendo o Joao para pintura)"
          value={recForm.title}
          onChange={(e) => setRecForm({ ...recForm, title: e.target.value })}
          required
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <textarea
          placeholder="Descreva sua experiência com este prestador... (opcional)"
          value={recForm.description}
          onChange={(e) =>
            setRecForm({ ...recForm, description: e.target.value })
          }
          rows={2}
          className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />

        {/* Toggle: cadastrado vs externo */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setRecMode("search");
              setExternalForm({ name: "", category: "", phone: "" });
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${recMode === "search" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
          >
            Buscar prestador
          </button>
          <button
            type="button"
            onClick={() => {
              setRecMode("external");
              setSelectedProvider(null);
              setProviderSearch("");
              setProviderResults([]);
            }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${recMode === "external" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
          >
            Prestador externo
          </button>
        </div>

        {/* Modo busca */}
        {recMode === "search" && (
          <div className="relative">
            {selectedProvider ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                  {selectedProvider.user?.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {selectedProvider.user?.name}
                  </p>
                  <p className="text-xs text-blue-600 capitalize">
                    {selectedProvider.category}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProvider(null);
                    setProviderSearch("");
                  }}
                  className="text-xs text-gray-400 hover:text-red-500 transition px-2 py-1"
                >
                  Trocar
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Buscar por nome ou email do prestador..."
                  value={providerSearch}
                  onChange={(e) => setProviderSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searchingProvider && (
                  <p className="text-xs text-gray-400 mt-1 px-1">Buscando...</p>
                )}
                {providerResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {providerResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedProvider(p);
                          setProviderSearch("");
                          setProviderResults([]);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-xs shrink-0">
                          {p.user?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {p.user?.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {p.user?.email} -{" "}
                            <span className="text-blue-500 capitalize">
                              {p.category}
                            </span>
                          </p>
                        </div>
                        {p.averageRating && (
                          <span className="text-xs text-yellow-600 font-medium">
                            {p.averageRating.toFixed(1)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {providerSearch.length >= 2 &&
                  !searchingProvider &&
                  providerResults.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1 px-1">
                      Nenhum prestador encontrado. Tente o modo &quot;Prestador
                      externo&quot;.
                    </p>
                  )}
              </>
            )}
          </div>
        )}

        {/* Modo externo */}
        {recMode === "external" && (
          <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-xs text-gray-500">
              Prestador que não esta cadastrado na plataforma
            </p>
            <input
              type="text"
              placeholder="Nome do prestador *"
              value={externalForm.name}
              onChange={(e) =>
                setExternalForm({ ...externalForm, name: e.target.value })
              }
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            <select
              value={externalForm.category}
              onChange={(e) =>
                setExternalForm({ ...externalForm, category: e.target.value })
              }
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Especialidade (opcional)</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            <input
              type="tel"
              placeholder="Telefone do prestador *"
              value={externalForm.phone}
              onChange={(e) =>
                setExternalForm({ ...externalForm, phone: e.target.value })
              }
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submittingRec}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition disabled:opacity-60 text-sm"
          >
            {submittingRec ? "Enviando..." : "Publicar"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-6 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
};

export default RecommendationForm;
