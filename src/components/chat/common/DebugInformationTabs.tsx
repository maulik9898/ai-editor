import { Editor } from "@monaco-editor/react";
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@radix-ui/react-accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Code } from "lucide-react";

export function DebugInformationTabs({
  input,
  output,
}: {
  input: any;
  output: any;
}) {
  return (
    <div>
      <Tabs defaultValue="input" className="w-full">
        <TabsList>
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
        </TabsList>

        <TabsContent value="input">
          <div className="h-64 border rounded">
            <Editor
              height="250px"
              language="json"
              value={JSON.stringify(input, null, 2)}
              options={{ readOnly: true, minimap: { enabled: false } }}
              theme="vs-dark"
            />
          </div>
        </TabsContent>

        <TabsContent value="output">
          <div className="h-64 border rounded">
            <Editor
              height="250px"
              language="json"
              value={JSON.stringify(output, null, 2)}
              options={{ readOnly: true, minimap: { enabled: false } }}
              theme="vs-dark"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
