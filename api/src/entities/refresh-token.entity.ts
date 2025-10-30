import { Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { User } from './user.entity';

@Entity({ tableName: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryKey()
  id!: number;

  @ManyToOne(() => User)
  user!: User;

  @Property()
  tokenHash!: string;

  @Property({ columnType: 'timestamptz' })
  expiresAt!: Date;

  @Property({ columnType: 'timestamptz', nullable: true })
  revokedAt?: Date | null;

  @Property({ columnType: 'timestamptz', defaultRaw: 'now()' })
  createdAt: Date = new Date();
}
