import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  Upload, 
  ArrowLeft,
  Save,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { api, apiHelpers } from '../../../services/api';
import { Slide } from '../../../types';
import Button from '../../../components/UI/Button';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const EditSlide: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [slide, setSlide] = useState<Slide | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm();

  useEffect(() => {
    if (id) {
      fetchSlide();
    }
  }, [id]);

  const fetchSlide = async () => {
    try {
      const response = await api.get(`/slides/${id}`);
      if (response.data.success) {
        const slideData = response.data.data.slide;
        setSlide(slideData);
        
        reset({
          title: slideData.title,
          subtitle: slideData.subtitle || '',
          description: slideData.description || '',
          buttonText: slideData.buttonText || '',
          buttonLink: slideData.buttonLink || '',
          order: slideData.order,
          backgroundColor: slideData.backgroundColor,
          textColor: slideData.textColor,
          position: slideData.position,
          isActive: slideData.isActive
        });

        if (slideData.image?.url) {
          setImagePreview(slideData.image.url);
        }
      }
    } catch (error) {
      toast.error('Erreur lors du chargement du slide');
      navigate('/admin/slides');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);

      const formData = new FormData();
      
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]?.toString() || '');
      });

      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await api.put(`/slides/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Slide mis à jour avec succès !');
        navigate('/admin/slides');
      } else {
        toast.error(response.data.message || 'Erreur lors de la mise à jour');
      }
    } catch (error: any) {
      console.error('Update slide error:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Chargement du slide..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/admin/slides')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Modifier le slide</h1>
              <p className="text-gray-600">{slide?.title}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Image */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Image du slide
            </h2>

            <div className="relative">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Choisir une nouvelle image</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Contenu
            </h2>

            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Titre *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  id="title"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-2">
                  Sous-titre
                </label>
                <input
                  {...register('subtitle')}
                  type="text"
                  id="subtitle"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin/slides')}
            >
              Annuler
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
              Mettre à jour
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSlide;