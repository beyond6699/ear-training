import * as React from "react"
import * as Collapsible from "@radix-ui/react-collapsible"
import { SdkFunction } from "@/types"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp } from "lucide-react"

const getBadgeVariant = (level: 'Critical' | 'High' | 'Medium' | 'Low'): 'destructive' | 'default' | 'secondary' | 'outline' => {
  switch (level) {
    case 'Critical':
      return 'destructive';
    case 'High':
      return 'default';
    case 'Medium':
      return 'secondary';
    case 'Low':
      return 'outline';
    default:
      return 'outline';
  }
};

interface FunctionCardProps {
  func: SdkFunction;
}

export function FunctionCard({ func }: FunctionCardProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      className="p-3 border-l-4 border-primary bg-secondary/50 rounded-r-lg"
    >
      <Collapsible.Trigger asChild>
        <button className="w-full flex items-center justify-between text-left">
          <h4 className="text-xl font-mono font-bold">{func.name}</h4>
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </Collapsible.Trigger>
      <Collapsible.Content className="pt-2">
        <p className="mt-1">{func.description}</p>
        <pre className="mt-2 p-2 bg-muted rounded text-sm"><code>{func.usage}</code></pre>
        {func.parameters.length > 0 && (
          <div className="mt-2">
            <h5 className="font-semibold">Parameters:</h5>
            <ul className="list-disc list-inside pl-2 mt-1 space-y-1">
              {func.parameters.map(param => (
                <li key={param.name}>
                  <code className="font-mono bg-muted px-1 rounded">{param.name}</code> ({param.type}): {param.description}
                </li>
              ))}
            </ul>
          </div>
        )}
         <div className="mt-2 flex space-x-4 text-sm">
            <Badge variant={getBadgeVariant(func.importance)}>
              Importance: {func.importance}
            </Badge>
            <Badge variant={getBadgeVariant(func.frequency)}>
              Frequency: {func.frequency}
            </Badge>
          </div>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}