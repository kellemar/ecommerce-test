/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ProductStatus, UserRole } from '../../entities';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

interface UploadedImageFile {
  originalname: string;
  buffer: Buffer;
}

function ensureMulterFile(
  file: UploadedImageFile | undefined | null,
): UploadedImageFile {
  if (!file) {
    throw new BadRequestException('Image file is required');
  }

  if (typeof file.originalname !== 'string' || !Buffer.isBuffer(file.buffer)) {
    throw new BadRequestException('Image file is required');
  }

  return file;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  list(@Query() query: ProductListQueryDto) {
    return this.productsService.list(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}

@Controller('public/products')
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  list(@Query() query: ProductListQueryDto) {
    return this.productsService.list({
      ...query,
      status: ProductStatus.Published,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const product = await this.productsService.findOne(id);
    if (!product || product.status !== ProductStatus.Published) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
@Controller('products/:productId/images')
export class ProductImagesController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async upload(
    @Param('productId', ParseIntPipe) productId: number,
    @UploadedFile() file: UploadedImageFile | undefined,
  ) {
    const multerFile = ensureMulterFile(file);
    const { originalname, buffer } = multerFile;

    return this.productsService.addImage(productId, {
      originalName: originalname,
      buffer,
    });
  }

  @Put(':imageId')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async replace(
    @Param('productId', ParseIntPipe) productId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @UploadedFile() file: UploadedImageFile | undefined,
  ) {
    const multerFile = ensureMulterFile(file);
    const { originalname, buffer } = multerFile;

    return this.productsService.replaceImage(productId, imageId, {
      originalName: originalname,
      buffer,
    });
  }
}
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
