import AttributeMap from './AttributeMap';

interface Op {
  // only one property out of {insert, delete, retain} will be present
  insert?: string | Record<string, unknown>;
  delete?: number;
  retain?: number | Record<string, unknown>;

  attributes?: AttributeMap;
}

namespace Op {
  export function length(op: Op): number {
    if (typeof op.delete === 'number') {
      return op.delete;
    } else if (typeof op.retain === 'number') {
      return op.retain;
    } else if (typeof op.retain === 'object' && op.retain !== null) {
      return 1;
    } else {
      return typeof op.insert === 'string' ? op.insert.length : 1;
    }
  }
}

export default Op;
