import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',
  useFactory: () => {
    // Si usas la variable CLOUDINARY_URL, no necesitas pasar nada más, 
    // Cloudinary la lee automáticamente si está en el ambiente.
    if (process.env.CLOUDINARY_URL) {
       return cloudinary;
    }

    // Si prefieres el método manual (asegúrate de que no haya espacios en el .env)
    return cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  },
};