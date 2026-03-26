const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const LOCAL_UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const MIME_EXTENSION_MAP = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

let cloudinaryClient;

const hasCloudinaryConfig = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

const getCloudinaryClient = () => {
  if (!hasCloudinaryConfig()) {
    return null;
  }

  if (!cloudinaryClient) {
    const { v2 } = require('cloudinary');

    v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    cloudinaryClient = v2;
  }

  return cloudinaryClient;
};

const ensureDirectory = async (directoryPath) => {
  await fs.mkdir(directoryPath, { recursive: true });
};

const resolveExtension = (originalName, mimeType) => {
  const fileExtension = path.extname(String(originalName || '')).toLowerCase();

  if (IMAGE_EXTENSIONS.has(fileExtension)) {
    return fileExtension;
  }

  return MIME_EXTENSION_MAP[mimeType] || '.jpg';
};

const uploadImageToCloudinary = ({ buffer, folder }) => {
  const client = getCloudinaryClient();

  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: `go-seven/${folder}`,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          url: result.secure_url,
          public_id: result.public_id,
          storage: 'cloudinary',
        });
      }
    );

    stream.end(buffer);
  });
};

const uploadImageLocally = async ({ buffer, originalName, mimeType, folder }) => {
  const targetDirectory = path.join(LOCAL_UPLOAD_ROOT, folder);
  const extension = resolveExtension(originalName, mimeType);
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;

  await ensureDirectory(targetDirectory);
  await fs.writeFile(path.join(targetDirectory, filename), buffer);

  const relativePath = `${folder}/${filename}`.replace(/\\/g, '/');

  return {
    url: `/uploads/${relativePath}`,
    public_id: `local:${relativePath}`,
    storage: 'local',
  };
};

const uploadImage = async ({ buffer, originalName, mimeType, folder = 'products' }) => {
  if (hasCloudinaryConfig()) {
    return uploadImageToCloudinary({ buffer, folder });
  }

  return uploadImageLocally({ buffer, originalName, mimeType, folder });
};

const destroyManagedAsset = async (publicId) => {
  if (!publicId) {
    return;
  }

  if (publicId.startsWith('local:')) {
    const relativePath = publicId.slice('local:'.length);
    const absolutePath = path.join(LOCAL_UPLOAD_ROOT, relativePath);

    try {
      await fs.rm(absolutePath, { force: true });
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    return;
  }

  if (!hasCloudinaryConfig()) {
    return;
  }

  const client = getCloudinaryClient();
  await client.uploader.destroy(publicId, { resource_type: 'image' });
};

module.exports = {
  LOCAL_UPLOAD_ROOT,
  destroyManagedAsset,
  hasCloudinaryConfig,
  uploadImage,
};
