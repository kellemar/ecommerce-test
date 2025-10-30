import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FilterQuery } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { Category, Product, ProductImage, ProductStatus } from '../../entities';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  private readonly imagesDirectory = path.resolve(
    __dirname,
    '../../../../../web/public/store/images',
  );

  constructor(private readonly em: EntityManager) {}

  private sanitizeBaseName(fileName: string): string {
    const stripped = fileName.replace(/\.[^/.]+$/, '');
    const sanitized = stripped.replace(/[^a-zA-Z0-9-_]/g, '').toLowerCase();
    return sanitized || 'image';
  }

  private generateFileName(originalName: string): string {
    const extension = path.extname(originalName).toLowerCase();
    const baseName = this.sanitizeBaseName(
      path.basename(originalName, extension),
    );
    const suffix = randomBytes(2).toString('hex');
    return `${baseName}${suffix}${extension}`;
  }

  private async ensureImagesDirectory(): Promise<void> {
    await fs.mkdir(this.imagesDirectory, { recursive: true });
  }

  private async saveImageFile(buffer: Buffer, fileName: string): Promise<void> {
    await this.ensureImagesDirectory();
    await fs.writeFile(path.join(this.imagesDirectory, fileName), buffer);
  }

  private isRemoteUrl(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://');
  }

  private async removeLocalImage(fileName: string): Promise<void> {
    if (!fileName || this.isRemoteUrl(fileName)) {
      return;
    }

    const safeName = path.basename(fileName);
    if (!safeName) {
      return;
    }

    try {
      await fs.unlink(path.join(this.imagesDirectory, safeName));
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const slug = dto.slug.trim().toLowerCase();
    const existingSlug = await this.em.findOne(Product, { slug });
    if (existingSlug) {
      throw new ConflictException('Product slug already in use');
    }

    const product = new Product();
    product.name = dto.name;
    product.slug = slug;
    product.description = dto.description;
    product.priceCents = dto.priceCents;
    product.stockQty = dto.stockQty;
    product.status = dto.status ?? ProductStatus.Draft;

    if (dto.categoryIds?.length) {
      const categories = await this.em.find(Category, {
        id: { $in: dto.categoryIds },
      });
      if (categories.length !== dto.categoryIds.length) {
        throw new NotFoundException('One or more categories not found');
      }
      product.categories.set(categories);
    }

    if (dto.images?.length) {
      for (const image of dto.images) {
        const productImage = new ProductImage();
        productImage.product = product;
        productImage.imageUrl = image.imageUrl;
        productImage.sortOrder = image.sortOrder ?? 0;
        product.images.add(productImage);
      }
    }

    await this.em.persistAndFlush(product);
    return product;
  }

  async list(query: ProductListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;

    const where: FilterQuery<Product> = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.name = { $ilike: `%${query.search.trim()}%` } as never;
    }

    const [items, count] = await this.em.findAndCount(Product, where, {
      offset: (page - 1) * limit,
      limit,
      orderBy: { createdAt: 'desc' },
      populate: ['images'],
    });

    return { items, count, page, limit };
  }

  findOne(id: number): Promise<Product | null> {
    return this.em.findOne(Product, id, { populate: ['images'] });
  }

  async update(id: number, dto: UpdateProductDto): Promise<Product> {
    const product = await this.em.findOne(Product, id, {
      populate: ['images', 'categories'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.name !== undefined) {
      product.name = dto.name;
    }

    if (dto.slug) {
      const slug = dto.slug.trim().toLowerCase();
      if (slug !== product.slug) {
        const existing = await this.em.findOne(Product, { slug });
        if (existing && existing.id !== product.id) {
          throw new ConflictException('Product slug already in use');
        }
        product.slug = slug;
      }
    }

    if (dto.description !== undefined) {
      product.description = dto.description;
    }

    if (dto.priceCents !== undefined) {
      product.priceCents = dto.priceCents;
    }

    if (dto.stockQty !== undefined) {
      product.stockQty = dto.stockQty;
    }

    if (dto.status) {
      product.status = dto.status;
    }

    if (dto.categoryIds) {
      const categories = await this.em.find(Category, {
        id: { $in: dto.categoryIds },
      });
      if (categories.length !== dto.categoryIds.length) {
        throw new NotFoundException('One or more categories not found');
      }
      product.categories.set(categories);
    }

    if (dto.images) {
      product.images.removeAll();
      for (const image of dto.images) {
        const productImage = new ProductImage();
        productImage.product = product;
        productImage.imageUrl = image.imageUrl;
        productImage.sortOrder = image.sortOrder ?? 0;
        product.images.add(productImage);
      }
    }

    await this.em.flush();
    return product;
  }

  async remove(id: number): Promise<void> {
    const product = await this.em.findOne(Product, id);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.em.removeAndFlush(product);
  }

  async addImage(
    productId: number,
    payload: { originalName: string; buffer: Buffer },
  ): Promise<ProductImage> {
    const product = await this.em.findOne(Product, productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const fileName = this.generateFileName(payload.originalName);
    await this.saveImageFile(payload.buffer, fileName);

    const existingCount = await this.em.count(ProductImage, {
      product: productId,
    });

    const image = new ProductImage();
    image.product = product;
    image.imageUrl = fileName;
    image.sortOrder = existingCount;
    product.images.add(image);

    await this.em.persistAndFlush(image);
    return image;
  }

  async replaceImage(
    productId: number,
    imageId: number,
    payload: { originalName: string; buffer: Buffer },
  ): Promise<ProductImage> {
    const image = await this.em.findOne(ProductImage, {
      id: imageId,
      product: productId,
    });

    if (!image) {
      throw new NotFoundException('Product image not found');
    }

    const previousFile = image.imageUrl;
    const fileName = this.generateFileName(payload.originalName);
    await this.saveImageFile(payload.buffer, fileName);

    image.imageUrl = fileName;
    await this.em.flush();

    await this.removeLocalImage(previousFile);

    return image;
  }
}
