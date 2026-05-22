import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export default cloudinary;

// Helper function to upload image
export const uploadImage = async (file: string, folder: string = 'products') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: `mamiglo-ecommerce/${folder}`,
      resource_type: 'auto',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    throw new Error(`Failed to upload image: ${error}`);
  }
};

// Helper function to delete image
export const deleteImage = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new Error(`Failed to delete image: ${error}`);
  }
};

// Helper function to upload multiple images
export const uploadMultipleImages = async (files: string[], folder: string = 'products') => {
  try {
    const uploadPromises = files.map(file => uploadImage(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    throw new Error(`Failed to upload images: ${error}`);
  }
};

// Export aliases for backward compatibility
export { uploadImage as uploadToCloudinary, deleteImage as deleteFromCloudinary };