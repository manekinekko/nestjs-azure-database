import { Inject } from '@nestjs/common';
import { ValueType } from './azure-table.interface';
import { getRepositoryToken } from './azure-table.providers';

export const AZURE_TABLE_ENTITY = 'azure-table-storage:entity';

type EntityFn = {
  name: string;
};

type AnnotationPropertyType =
  // Note: PartitionKey has been renamed to partitionKey
  | 'partitionKey'
  // Note: RowKey has been renamed to rowKey
  | 'rowKey'
  | 'Int32'
  | 'Int64'
  | 'Binary'
  | 'Boolean'
  | 'String'
  | 'Guid'
  | 'Double'
  | 'DateTime';

function validateType(edmType: AnnotationPropertyType, target: object /* Function */, propertyKey?: string) {
  if (propertyKey) {
    // tslint:disable-next-line: ban-types
    const propertyType = Reflect.getMetadata('design:type', target, propertyKey) as () => void;

    let edmTypeName = '';
    if (edmType === 'Int32' || edmType === 'Int64' || edmType === 'Double') {
      edmTypeName = Number.name;
    } else if (edmType === 'Boolean') {
      edmTypeName = Boolean.name;
    } else if (edmType === 'DateTime') {
      edmTypeName = Date.name;
    } else if (edmType === 'String' || edmType === 'Guid') {
      edmTypeName = String.name;
    } else if (edmType === 'Binary') {
      edmTypeName = Blob.name;
    } else {
      throw new Error(`Type ${edmType} is not supported.`);
    }

    if (edmTypeName.toLowerCase().includes(propertyType.name.toLocaleLowerCase()) === false) {
      throw new Error(
        `EDM type of "${target.constructor.name}.${propertyKey}" is ${edmType}. The equivalent of ${edmType} is ${edmTypeName}. ` +
          `"${propertyKey}" should be of type ${edmTypeName}. Got ${propertyType.name}`,
      );
    }
  }
}

// NOTE: Class annotation (partitionKey or rowKey) have been deprecated.
function annotate(value: ValueType | undefined, type: AnnotationPropertyType) {
  return (target: object /* Function */, propertyKey?: string) => {
    // check if the property type matches the annotated type
    validateType(type, target, propertyKey);

    const isPropertyAnnotation = typeof propertyKey === 'string';

    // define metadata on the parent level
    target = isPropertyAnnotation ? target.constructor : target;

    // get previous stored entity descriptor
    const storedEntityDescriptor = Reflect.getMetadata(AZURE_TABLE_ENTITY, target) || {};
    let entityDescriptor = {
      ...storedEntityDescriptor,
    };

    if (typeof value === 'string') {
      // Do nothing
    } else if (typeof value === 'function') {
      value = value(new (target as any)());
    } else {
      value = propertyKey;
    }

    // Note: if propertyKey is truthy, we are then annotating a class property declaration
    if (isPropertyAnnotation) {
      entityDescriptor = {
        [propertyKey]: { value, type },
        ...entityDescriptor,
      };
    } else {
      const isPartitionKey = type === 'partitionKey';
      const isRowKey = type === 'rowKey';
      if (isPartitionKey || isRowKey) {
        entityDescriptor = {
          ...entityDescriptor,
          [type]: value,
        };
      }
    }

    Reflect.defineMetadata(AZURE_TABLE_ENTITY, entityDescriptor, target);
  };
}

/** @deprecated */
export function EntityPartitionKey(value: ValueType) {
  return annotate(value, 'partitionKey');
}

/** @deprecated */
export function EntityRowKey(value: ValueType) {
  return annotate(value, 'rowKey');
}

export function EntityInt32(value?: string) {
  return annotate(value, 'Int32');
}

export function EntityInt64(value?: string) {
  return annotate(value, 'Int64');
}

export function EntityBinary(value?: string) {
  return annotate(value, 'Binary');
}

export function EntityBoolean(value?: string) {
  return annotate(value, 'Boolean');
}

export function EntityString(value?: string) {
  return annotate(value, 'String');
}

export function EntityGuid(value?: string) {
  return annotate(value, 'Guid');
}

export function EntityDouble(value?: string) {
  return annotate(value, 'Double');
}

export function EntityDateTime(value?: string) {
  return annotate(value, 'DateTime');
}

export const InjectRepository = (entity: EntityFn) => Inject(getRepositoryToken(entity));
