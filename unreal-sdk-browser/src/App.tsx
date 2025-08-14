"use client";

import { useState, useEffect } from "react";
import { SdkModule } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeProvider } from "@/components/theme-provider";
import { FunctionCard } from "@/components/FunctionCard";

export default function App() {
  const [sdkData, setSdkData] = useState<SdkModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetch('/sdk.json')
      .then(response => response.json())
      .then(data => {
        setSdkData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch SDK data:", error);
        setLoading(false);
      });
  }, []);

  const filteredData = sdkData
    .map(module => {
      if (module.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return module;
      }

      const filteredClasses = module.classes
        .map(cls => {
          if (cls.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return cls;
          }

          const filteredFunctions = cls.functions.filter(func =>
            func.name.toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (filteredFunctions.length > 0) {
            return { ...cls, functions: filteredFunctions };
          }

          return null;
        })
        .filter((cls): cls is NonNullable<typeof cls> => cls !== null);

      if (filteredClasses.length > 0) {
        return { ...module, classes: filteredClasses };
      }

      return null;
    })
    .filter((module): module is NonNullable<typeof module> => module !== null);

  if (loading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <div className="flex h-screen items-center justify-center">
          <p className="text-lg">Loading SDK data...</p>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="flex h-screen">
        <aside className="w-1/4 p-4 overflow-y-auto bg-secondary">
          <h2 className="text-2xl font-bold mb-4">Modules</h2>
          <ul>
            {sdkData.map((module) => (
              <li key={module.name} className="mb-2">
                <a href={`#${module.name}`} className="font-semibold text-primary hover:underline">
                  {module.name}
                </a>
              </li>
            ))}
          </ul>
        </aside>
        <main className="w-3/4 p-10 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-6 pb-4">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
              Unreal Engine 5.6 C++ SDK Browser
            </h1>
            <Input
              type="text"
              placeholder="Search for functions, classes, or modules..."
              className="w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="mt-8 space-y-12">
            {filteredData.length > 0 ? (
              filteredData.map((module) => (
                <section key={module.name} id={module.name}>
                  <h2 className="text-3xl font-bold border-b pb-2 mb-4">{module.name}</h2>
                  <p className="text-lg text-muted-foreground mb-6">{module.description}</p>
                  <div className="space-y-8">
                    {module.classes.map((cls) => (
                      <Card key={cls.name}>
                        <CardHeader>
                          <CardTitle>{cls.name}</CardTitle>
                          <CardDescription>{cls.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                      {cls.functions.map((func) => (
                        <FunctionCard key={func.name} func={func} />
                      ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-lg text-muted-foreground">No results found for "{searchTerm}".</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ThemeProvider>
  );
}