import { defaultSchema } from 'rehype-sanitize';

const globalAttributes = defaultSchema.attributes?.['*'] ?? [];
const codeAttributes = defaultSchema.attributes?.code ?? [];
const inputAttributes = defaultSchema.attributes?.input ?? [];

export const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [...globalAttributes, 'className'],
    a: [...(defaultSchema.attributes?.a ?? []), ['target', '_blank'], ['rel', 'noreferrer']],
    code: [...codeAttributes, ['className', /^language-./]],
    div: [...(defaultSchema.attributes?.div ?? []), 'className'],
    input: [...inputAttributes, ['type', 'checkbox'], 'checked', 'disabled'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className'],
    table: [...(defaultSchema.attributes?.table ?? []), 'className'],
  },
};
