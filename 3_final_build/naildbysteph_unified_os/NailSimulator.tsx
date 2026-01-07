import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Hand, Droplet, Paintbrush, Scissors, CheckCircle, XCircle, RefreshCw, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// --- Simulator State and Logic ---

type NailState = {
  cleanliness: number; // 0-100
  cuticleHealth: number; // 0-100
  nailLength: number; // 0-100 (short to long)
  polishQuality: number; // 0-100
  baseColor: string;
  design: string;
};

type Tool = {
  id: string;
  name: string;
  icon: React.ElementType;
  effect: (state: NailState) => NailState;
  cost: number;
  description: string;
};

const initialNailState: NailState = {
  cleanliness: 20,
  cuticleHealth: 80,
  nailLength: 50,
  polishQuality: 0,
  baseColor: "natural",
  design: "none",
};

const tools: Tool[] = [
  {
    id: "cleaner",
    name: "Nail Cleaner",
    icon: Droplet,
    cost: 5,
    description: "Removes dirt and oil. Increases cleanliness.",
    effect: (state) => ({
      ...state,
      cleanliness: Math.min(100, state.cleanliness + 30),
    }),
  },
  {
    id: "cuticle_pusher",
    name: "Cuticle Pusher",
    icon: Scissors,
    cost: 10,
    description: "Gently pushes back cuticles. Improves cuticle health, but overuse can hurt.",
    effect: (state) => ({
      ...state,
      cuticleHealth: Math.min(100, state.cuticleHealth + 15),
    }),
  },
  {
    id: "clipper",
    name: "Nail Clipper",
    icon: Scissors,
    cost: 5,
    description: "Trims the nail length. Reduces nail length.",
    effect: (state) => ({
      ...state,
      nailLength: Math.max(0, state.nailLength - 20),
    }),
  },
  {
    id: "base_coat",
    name: "Base Coat",
    icon: Paintbrush,
    cost: 15,
    description: "Prepares the nail for polish. Sets base color to 'white' and polish quality to 10.",
    effect: (state) => ({
      ...state,
      baseColor: "white",
      polishQuality: Math.min(100, state.polishQuality + 10),
    }),
  },
  {
    id: "color_polish",
    name: "Color Polish",
    icon: Droplet,
    cost: 20,
    description: "Applies the main color. Increases polish quality.",
    effect: (state) => ({
      ...state,
      polishQuality: Math.min(100, state.polishQuality + 40),
    }),
  },
  {
    id: "top_coat",
    name: "Top Coat",
    icon: Droplet,
    cost: 25,
    description: "Seals the color and adds shine. Greatly increases polish quality.",
    effect: (state) => ({
      ...state,
      polishQuality: Math.min(100, state.polishQuality + 50),
    }),
  },
];

const calculateScore = (state: NailState): number => {
  const { cleanliness, cuticleHealth, nailLength, polishQuality } = state;
  
  // Weights: Prep (Cleanliness, Cuticle) is 40%, Polish is 60%
  const prepScore = (cleanliness * 0.5 + cuticleHealth * 0.5) * 0.4;
  const polishScore = polishQuality * 0.6;
  
  // Penalty for not having a base coat before polish
  const baseCoatPenalty = state.baseColor === "natural" && polishQuality > 0 ? 20 : 0;

  return Math.max(0, Math.round(prepScore + polishScore - baseCoatPenalty));
};

// --- UI Components ---

const NailVisualizer = ({ state }: { state: NailState }) => {
  const { cleanliness, cuticleHealth, nailLength, polishQuality, baseColor } = state;

  const nailColor = polishQuality > 0 ? (baseColor === "white" ? "bg-white" : "bg-pink-300") : "bg-yellow-100";
  const nailShadow = polishQuality > 70 ? "shadow-lg shadow-pink-500/50" : "";
  const cuticleColor = cuticleHealth < 50 ? "bg-red-500" : "bg-green-500";
  const dirtColor = cleanliness < 50 ? "bg-amber-900/50" : "bg-transparent";

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-xl shadow-inner">
      <Hand className="w-24 h-24 text-gray-500 mb-4" />
      <div className="relative w-20 h-32 bg-gray-300 rounded-t-full flex items-end justify-center overflow-hidden border-4 border-gray-400">
        {/* Nail Bed */}
        <div className={cn("absolute bottom-0 w-full", nailColor, nailShadow)} style={{ height: `${50 + nailLength * 0.5}%` }}>
          {/* Dirt/Cleanliness Overlay */}
          <div className={cn("absolute inset-0 opacity-50", dirtColor)}></div>
          {/* Polish Quality Overlay */}
          <div className="absolute inset-0 bg-pink-500/50" style={{ opacity: polishQuality / 100 }}></div>
        </div>
        {/* Cuticle */}
        <div className={cn("absolute top-0 w-full h-4 rounded-b-full", cuticleColor)}></div>
      </div>
      <p className="mt-4 text-sm font-medium">Simulated Nail</p>
    </div>
  );
};

const ToolButton = ({ tool, onClick, disabled }: { tool: Tool, onClick: () => void, disabled: boolean }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button 
        variant="outline" 
        size="lg" 
        onClick={onClick} 
        disabled={disabled}
        className="flex flex-col h-24 w-24 items-center justify-center text-center"
      >
        <tool.icon className="w-6 h-6 mb-1 text-pink-600" />
        <span className="text-xs font-medium">{tool.name}</span>
        <span className="text-xs text-gray-500">(${tool.cost})</span>
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>{tool.description}</p>
    </TooltipContent>
  </Tooltip>
);

// --- Main Component ---

export default function NailSimulator() {
  const [state, setState] = useState<NailState>(initialNailState);
  const [budget, setBudget] = useState(100);
  const [steps, setSteps] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const score = useMemo(() => calculateScore(state), [state]);

  const applyTool = useCallback((tool: Tool) => {
    if (budget < tool.cost) {
      toast.error(`Not enough budget! Need $${tool.cost}, have $${budget}.`);
      return;
    }
    
    setState(tool.effect);
    setBudget(b => b - tool.cost);
    setSteps(s => s + 1);
    toast.info(`Used ${tool.name}. Budget: $${budget - tool.cost}`);
  }, [budget, getAiGuidance]);

  const resetSimulator = () => {
    setState(initialNailState);
    setBudget(100);
    setSteps(0);
    setIsFinished(false);
    getAiGuidance("Start of nail simulation. Initial state: " + JSON.stringify(initialNailState));
    toast.success("Simulator reset. New client!");
  };

  const finishAppointment = () => {
    setIsFinished(true);
    const finalMessage = `I finished the appointment with a final score of ${score}. The final state was: ${JSON.stringify(state)}. Give me a final, encouraging, and constructive summary of the job.`;
    getAiGuidance(finalMessage);
    if (score >= 80) {
      toast.success(`Appointment finished! Final Score: ${score}. Great job, girl!`);
    } else {
      toast.warning(`Appointment finished! Final Score: ${score}. We need to work on that, sis.`);
    }
  };

  // AI Integration
  const [aiGuidance, setAiGuidance] = useState("Welcome to the sim! Let's get this nail done. What's your first move?");
  const aiMutation = trpc.ai.message.useMutation();

  const getAiGuidance = useCallback(async (message: string) => {
    try {
      const result = await aiMutation.mutateAsync({ message });
      setAiGuidance(result.response);
    } catch (error) {
      console.error("AI Guidance Error:", error);
      setAiGuidance("My bad, girl. Ran into a little drama trying to give you advice. Try again?");
    }
  }, []);

  // Initial guidance
  useEffect(() => {
    getAiGuidance("Start of nail simulation. Initial state: " + JSON.stringify(initialNailState));
  }, []);

  // Guidance after each step
  useEffect(() => {
    if (steps > 0) {
      const message = `I just took step ${steps}. The current nail state is: ${JSON.stringify(state)}. The current score is ${score}. Give me a short, workflow-focused tip or encouragement based on the state.`;
      getAiGuidance(message);
    }
  }, [steps, score, state]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-pink-600 flex items-center gap-3 mb-6">
          <Hand className="w-8 h-8" />
          Nail Appointment Simulator
        </h1>
        <p className="text-gray-600 mb-8">
          Practice your nail tech skills! Use the tools to achieve the highest possible score while staying within budget.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Visualizer and Stats */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hand className="w-5 h-5" />
                Client Nail Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <NailVisualizer state={state} />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Final Score:</span>
                  <span className={cn("text-2xl font-bold", score >= 80 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600")}>
                    {score} / 100
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Budget Left:</span>
                  <span className={cn("text-xl font-bold", budget < 20 ? "text-red-600" : "text-gray-800")}>
                    ${budget}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Steps Taken:</span>
                  <span className="text-xl font-bold text-gray-800">
                    {steps}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span>Cleanliness</span><span>{state.cleanliness}%</span></div>
                <Slider value={[state.cleanliness]} max={100} step={1} disabled className="[&>span:first-child]:bg-pink-600" />
                
                <div className="flex justify-between text-sm"><span>Cuticle Health</span><span>{state.cuticleHealth}%</span></div>
                <Slider value={[state.cuticleHealth]} max={100} step={1} disabled className="[&>span:first-child]:bg-pink-600" />
                
                <div className="flex justify-between text-sm"><span>Polish Quality</span><span>{state.polishQuality}%</span></div>
                <Slider value={[state.polishQuality]} max={100} step={1} disabled className="[&>span:first-child]:bg-pink-600" />
              </div>

              <div className="flex gap-4">
                <Button onClick={finishAppointment} disabled={isFinished} className="flex-1" variant="default">
                  <CheckCircle className="w-4 h-4 mr-2" /> Finish Appointment
                </Button>
                <Button onClick={resetSimulator} variant="outline" size="icon">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Column 2: Tools */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="w-5 h-5" />
                Available Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {tools.map(tool => (
                  <ToolButton 
                    key={tool.id} 
                    tool={tool} 
                    onClick={() => applyTool(tool)} 
                    disabled={isFinished || budget < tool.cost}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Column 3: AI Guidance */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-pink-600">
                <Sparkles className="w-5 h-5" />
                Homegirl AI Guidance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg italic text-gray-700">
                "{aiGuidance}"
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
