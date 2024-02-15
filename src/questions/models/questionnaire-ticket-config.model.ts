import { Field, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { QuestionnaireTicket } from './questionnaire-ticket.model';

@ObjectType()
@Entity()
export class QuestionnaireTicketConfig {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Field()
  decisionMakingModel: string;

  @Column()
  @Field(() => Int)
  standAsidesLimit: number;

  @Column()
  @Field(() => Int)
  reservationsLimit: number;

  @Column()
  @Field(() => Int)
  ratificationThreshold: number;

  @Column({ nullable: true })
  @Field({ nullable: true })
  closingAt?: Date;

  @OneToOne(
    () => QuestionnaireTicket,
    (questionnaireTicket) => questionnaireTicket.config,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn()
  questionnaireTicket: QuestionnaireTicket;

  @Column()
  questionnaireTicketId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
