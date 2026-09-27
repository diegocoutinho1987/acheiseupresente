import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { TaxonomyItem } from "@/services/taxonomyService";

type Props = {
  label: string;
  items: TaxonomyItem[];
  selected: string[];
  onChange: (ids: string[]) => void;
  required?: boolean;
  error?: string | undefined;
};

export function TaxonomyMultiSelect({ label, items, selected, onChange, required, error }: Props) {
  const available = items.filter((item) => item.active || selected.includes(item.id));
  const selectedItems = available.filter((item) => selected.includes(item.id));
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);

  return (
    <div>
      <p className="text-sm font-medium">{label}{required && <span className="text-destructive"> *</span>}</p>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="mt-2 h-auto min-h-10 w-full justify-between font-normal" aria-label={`Selecionar ${label.toLowerCase()}`}>
            <span className="min-w-0 truncate text-left">{selectedItems.length ? selectedItems.map((item) => item.name).join(", ") : `Selecione ${label.toLowerCase()}`}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Buscar ${label.toLowerCase()}…`} />
            <CommandList>
              <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
              <CommandGroup>
                {available.map((item) => (
                  <CommandItem key={item.id} value={item.name} onSelect={() => toggle(item.id)}>
                    <Checkbox checked={selected.includes(item.id)} aria-hidden />
                    <span className="flex-1">{item.name}</span>
                    {!item.active && <span className="text-xs text-muted-foreground">Inativo</span>}
                    {selected.includes(item.id) && <Check className="h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
    </div>
  );
}