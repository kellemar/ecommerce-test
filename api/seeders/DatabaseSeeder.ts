import { EntityManager } from '@mikro-orm/postgresql';
import { Seeder } from '@mikro-orm/seeder';
import { hash as hashPassword } from 'argon2';
import {
  Category,
  Product,
  ProductImage,
  ProductStatus,
  User,
  UserRole,
} from '../src/entities';

const sampleProducts = [
  {
    name: 'Mandai Eco Bottle',
    slug: 'mandai-eco-bottle',
    description:
      'Insulated stainless-steel bottle inspired by Mandai wildlife, keeps drinks cold for 24h.',
    priceCents: 3499,
    stockQty: 120,
    status: ProductStatus.Published,
    categories: ['Accessories', 'Eco Friendly'],
    images: [
      {
        imageUrl:
          'mandai_bottle.png',
        sortOrder: 0,
      },
    ],
  },
  {
    name: 'Rainforest Explorer Tee',
    slug: 'rainforest-explorer-tee',
    description:
      'Super-soft organic cotton t-shirt featuring rainforest wildlife illustration.',
    priceCents: 2599,
    stockQty: 85,
    status: ProductStatus.Published,
    categories: ['Apparel'],
    images: [
      {
        imageUrl:
          'mandai_tee2491.png',
        sortOrder: 0,
      },
    ],
  },
  {
    name: 'Safari Adventure Kit',
    slug: 'safari-adventure-kit',
    description:
      'Gift bundle with field notebook, reusable utensils, and animal stickers for young explorers.',
    priceCents: 4999,
    stockQty: 45,
    status: ProductStatus.Published,
    categories: ['Kids', 'Gift Sets'],
    images: [
      {
        imageUrl:
          'mandai_kit.png',
        sortOrder: 0,
      },
    ],
  },
];

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.seedUsers(em);
    await this.seedCatalog(em);
  }

  private async seedUsers(em: EntityManager): Promise<void> {
    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
    const adminPassword =
      process.env.SEED_ADMIN_PASSWORD ?? 'AdminPassw0rd!';

    const existingAdmin = await em.findOne(User, { email: adminEmail });
    if (!existingAdmin) {
      const adminUser = new User();
      adminUser.email = adminEmail;
      adminUser.passwordHash = await hashPassword(adminPassword);
      adminUser.fullName = 'Mandai Admin';
      adminUser.role = UserRole.Admin;
      em.persist(adminUser);
    }

    const customerEmail =
      process.env.SEED_CUSTOMER_EMAIL ?? 'customer@example.com';
    const customerPassword =
      process.env.SEED_CUSTOMER_PASSWORD ?? 'CustomerPassw0rd!';
    const existingCustomer = await em.findOne(User, { email: customerEmail });
    if (!existingCustomer) {
      const customer = new User();
      customer.email = customerEmail;
      customer.passwordHash = await hashPassword(customerPassword);
      customer.fullName = 'Mandai Customer';
      customer.role = UserRole.Customer;
      em.persist(customer);
    }

    await em.flush();
  }

  private async seedCatalog(em: EntityManager): Promise<void> {
    const existingProducts = await em.count(Product, {});
    if (existingProducts > 0) {
      return;
    }

    const categoriesByName = new Map<string, Category>();

    const getOrCreateCategory = async (name: string): Promise<Category> => {
      const normalized = name.trim();
      const cached = categoriesByName.get(normalized);
      if (cached) {
        return cached;
      }

      const slug = normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let category = await em.findOne(Category, { slug });
      if (!category) {
        category = new Category();
        category.name = normalized;
        category.slug = slug;
        em.persist(category);
      }
      categoriesByName.set(normalized, category);
      return category;
    };

    for (const productData of sampleProducts) {
      const product = new Product();
      product.name = productData.name;
      product.slug = productData.slug;
      product.description = productData.description;
      product.priceCents = productData.priceCents;
      product.stockQty = productData.stockQty;
      product.status = productData.status;

      for (const categoryName of productData.categories) {
        const category = await getOrCreateCategory(categoryName);
        product.categories.add(category);
      }

      for (const imageData of productData.images) {
        const image = new ProductImage();
        image.product = product;
        image.imageUrl = imageData.imageUrl;
        image.sortOrder = imageData.sortOrder ?? 0;
        product.images.add(image);
        em.persist(image);
      }

      em.persist(product);
    }

    await em.flush();
  }
}
