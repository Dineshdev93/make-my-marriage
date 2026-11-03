import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { formatRupeesWhileTyping } from "@/lib/wedding-setup";

export interface WeddingFieldValues {
  name: string;
  coupleNames: string;
  weddingDate: string;
  budgetRupees: string;
}

interface WeddingFieldsProps {
  values: WeddingFieldValues;
  errors: Record<string, string>;
  onChange: (field: keyof WeddingFieldValues, value: string) => void;
  budgetHelperText?: string;
}

export function WeddingFields({ values, errors, onChange, budgetHelperText = "Enter the whole amount in rupees" }: WeddingFieldsProps) {
  return (
    <div className="flex flex-col gap-5">
      <FormField error={errors.name} htmlFor="wedding-name" label="Wedding name">
        <Input autoComplete="off" id="wedding-name" maxLength={100} onChange={(event) => onChange("name", event.target.value)} placeholder="Aarav & Meera's Wedding" required value={values.name} />
      </FormField>

      <FormField error={errors.coupleNames} htmlFor="couple-names" label="Couple names">
        <Input autoComplete="off" id="couple-names" maxLength={150} onChange={(event) => onChange("coupleNames", event.target.value)} placeholder="Aarav and Meera" required value={values.coupleNames} />
      </FormField>

      <FormField error={errors.weddingDate} helper="You can change this later" htmlFor="wedding-date" label="Wedding date">
        <Input id="wedding-date" onChange={(event) => onChange("weddingDate", event.target.value)} required type="date" value={values.weddingDate} />
      </FormField>

      <FormField error={errors.totalBudgetPaise} helper={budgetHelperText} htmlFor="wedding-budget" label="Total budget">
        <span className="relative block">
          <span aria-hidden="true" className="absolute inset-y-0 left-4 flex items-center font-heading text-xl">₹</span>
          <Input className="pl-10" id="wedding-budget" inputMode="numeric" onChange={(event) => onChange("budgetRupees", formatRupeesWhileTyping(event.target.value))} placeholder="15,00,000" required value={values.budgetRupees} />
        </span>
      </FormField>
    </div>
  );
}
