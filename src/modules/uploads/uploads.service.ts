import { Injectable } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import * as streamifier from 'streamifier';
import { UploadResponseDto } from './dto/upload-response.dto';

const CLOUDINARY_FOLDER = 'maya-croche/products';

@Injectable()
export class UploadsService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  uploadImage(file: Express.Multer.File): Promise<UploadResponseDto> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: CLOUDINARY_FOLDER, resource_type: 'image' },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error || !result) {
            reject(
              new Error(
                error?.message ?? 'Falha ao enviar imagem para o Cloudinary',
              ),
            );
            return;
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );

      streamifier.createReadStream(file.buffer).pipe(stream);
    });
  }
}
