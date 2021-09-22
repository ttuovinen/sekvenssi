type ModeSpecific = {
  direction?: number;
  mimicStep?: number;
  transpose?: number;
  repeat?: number;
  wrap?: boolean;
};

type StepArray = [number[], string, ModeSpecific?][];
