import { InjectRepository, Repository } from '@nestjs/azure-database';
import { Injectable } from '@nestjs/common';
import { Event } from './event.entity';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async find(partitionKey: string, rowKey: string): Promise<Event> {
    return await this.eventRepository.find(partitionKey, rowKey);
  }

  async create(event: Event): Promise<Event> {
    return await this.eventRepository.create(event);
  }

  async update(
    partitionKey: string,
    rowKey: string,
    event: Event,
  ): Promise<Event> {
    return await this.eventRepository.update(partitionKey, rowKey, event);
  }

  async delete(partitionKey: string, rowKey: string): Promise<void> {
    await this.eventRepository.delete(partitionKey, rowKey);
  }
}
