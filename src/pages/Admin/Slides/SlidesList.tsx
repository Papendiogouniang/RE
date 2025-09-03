import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Star
} from 'lucide-react';
import { apiHelpers } from '../../../services/api';
import { Slide } from '../../../types';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import Button from '../../../components/UI/Button';
import toast from 'react-hot-toast';

const SlidesList: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    try {
      setLoading(true);
      const response = await apiHelpers.getAdminSlides();
      if (response.success) {
        setSlides(response.data.slides);
      }
    } catch (error) {
      console.error('Error fetching slides:', error);
      toast.error('Erreur lors du chargement des slides');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSlide = async (slideId: string) => {
    try {
      const response = await apiHelpers.toggleSlide(slideId);
      if (response.success) {
        toast.success('Statut du slide mis à jour');
        fetchSlides();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce slide ?')) {
      return;
    }

    try {
      const response = await apiHelpers.deleteSlide(slideId);
      if (response.success) {
        toast.success('Slide supprimé avec succès');
        fetchSlides();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredSlides = slides.filter(slide => 
    searchTerm === '' || 
    slide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    slide.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des slides</h1>
            <p className="text-gray-600">Gérez les slides de la page d'accueil</p>
          </div>
          <Link to="/admin/slides/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau slide
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un slide..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            />
          </div>
        </div>

        {/* Slides List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" text="Chargement des slides..." />
          </div>
        ) : filteredSlides.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun slide trouvé
            </h3>
            <p className="text-gray-600 mb-6">
              Commencez par créer votre premier slide
            </p>
            <Link to="/admin/slides/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Créer un slide
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSlides.map((slide, index) => (
              <div key={slide._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                  {/* Slide Preview */}
                  <div className="lg:col-span-1">
                    <div className="relative">
                      {slide.image?.url ? (
                        <img
                          src={slide.image.url}
                          alt={slide.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-white" />
                        </div>
                      )}
                      
                      {/* Order Badge */}
                      <div className="absolute top-2 left-2">
                        <span className="bg-black text-yellow-500 px-2 py-1 rounded-full text-xs font-medium">
                          #{slide.order}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => handleToggleSlide(slide._id)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            slide.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {slide.isActive ? (
                            <>
                              <Eye className="w-3 h-3 inline mr-1" />
                              Actif
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 inline mr-1" />
                              Inactif
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Slide Info */}
                  <div className="lg:col-span-2">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {slide.title}
                        </h3>
                        {slide.subtitle && (
                          <p className="text-gray-600 mb-2">{slide.subtitle}</p>
                        )}
                        {slide.description && (
                          <p className="text-sm text-gray-500">{slide.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Position:</span>
                        <p className="text-gray-900 capitalize">{slide.position}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Couleur fond:</span>
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded mr-2 border"
                            style={{ backgroundColor: slide.backgroundColor }}
                          />
                          <span className="text-gray-900">{slide.backgroundColor}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Couleur texte:</span>
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded mr-2 border"
                            style={{ backgroundColor: slide.textColor }}
                          />
                          <span className="text-gray-900">{slide.textColor}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Créé le:</span>
                        <p className="text-gray-900">{formatDate(slide.createdAt)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Aperçu
                        </Button>
                        <Link to={`/admin/slides/${slide._id}/edit`}>
                          <Button variant="primary" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </Button>
                        </Link>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleDeleteSlide(slide._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlidesList;