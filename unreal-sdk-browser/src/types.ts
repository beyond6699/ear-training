export interface SdkFunction {
  name: string;
  description: string;
  usage: string;
  frequency: 'High' | 'Medium' | 'Low';
  importance: 'Critical' | 'High' | 'Medium' | 'Low';
  parameters: { name: string; type: string; description: string }[];
  returnType: string;
}

export interface SdkClass {
  name: string;
  description: string;
  functions: SdkFunction[];
}

export interface SdkModule {
  name: string;
  description: string;
  classes: SdkClass[];
}