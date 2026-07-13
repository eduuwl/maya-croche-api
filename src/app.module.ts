import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { SiteModule } from './modules/site/site.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrdersModule } from './modules/orders/orders.module';
import { QuotesModule } from './modules/quotes/quotes.module';
import { ContactModule } from './modules/contact/contact.module';

@Module({
  imports: [
    DatabaseModule,
    ProductsModule,
    CategoriesModule,
    CollectionsModule,
    SiteModule,
    UploadsModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    QuotesModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
