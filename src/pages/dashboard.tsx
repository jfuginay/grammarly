import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import FloatingSuggestion from "@/components/FloatingSuggestion";
import { 
  AlertCircle, 
  CheckCircle, 
  Lightbulb, 
  X, 
  User, 
  LogOut, 
  FileText,
  Sparkles,
  Eye,
  EyeOff,
  HelpCircle
} from "lucide-react";

interface Suggestion {
  id: string;
  type: 'spelling' | 'grammar' | 'style';
  text: string;
  replacement: string;
  explanation: string;
  startIndex: number;
  endIndex: number;
  severity: 'error' | 'warning' | 'suggestion';
}

// Comprehensive spell checker with extensive misspellings and typos database
const spellCheckDict: Record<string, string> = {
  // Common transposed letters
  'teh': 'the',
  'adn': 'and',
  'fro': 'for',
  'fo': 'of',
  'hte': 'the',
  'taht': 'that',
  'thsi': 'this',
  'jsut': 'just',
  'mroe': 'more',
  'oyu': 'you',
  'yuor': 'your',
  'yuo': 'you',
  'cna': 'can',
  'ahve': 'have',
  'si': 'is',
  'sya': 'say',
  'amke': 'make',
  'waht': 'what',
  'wnat': 'want',
  'otehr': 'other',
  'moer': 'more',
  'hwo': 'how',
  'nto': 'not',
  'wrok': 'work',
  'baout': 'about',
  'whne': 'when',
  'eahc': 'each',
  'owrk': 'work',
  'palce': 'place',
  'tihs': 'this',
  'thru': 'through',
  'siad': 'said',
  'woudl': 'would',
  'coudl': 'could',
  'shoudl': 'should',
  'peopel': 'people',
  'freind': 'friend',
  'freinds': 'friends',
  'compnay': 'company',
  'mananger': 'manager',
  
  // I before E except after C violations
  'recieve': 'receive',
  'concieve': 'conceive',
  'decieve': 'deceive',
  'percieve': 'perceive',
  'beleive': 'believe',
  'acheive': 'achieve',
  'yeild': 'yield',
  'feild': 'field',
  'wierd': 'weird',
  
  // Double consonant errors
  'seperate': 'separate',
  'definately': 'definitely',
  'occured': 'occurred',
  'accomodate': 'accommodate',
  'neccessary': 'necessary',
  'embarass': 'embarrass',
  'begining': 'beginning',
  'comming': 'coming',
  'runing': 'running',
  'stoping': 'stopping',
  'geting': 'getting',
  'siting': 'sitting',
  'writting': 'writing',
  'puting': 'putting',
  'cuming': 'coming',
  'planing': 'planning',
  'controling': 'controlling',
  'modeling': 'modelling',
  'travelig': 'traveling',
  'quareling': 'quarreling',
  'marveling': 'marveling',
  
  // -ance vs -ence confusion
  'existance': 'existence',
  'maintainance': 'maintenance',
  'independant': 'independent',
  'appearence': 'appearance',
  'persistant': 'persistent',
  'consistant': 'consistent',
  'dependant': 'dependent',
  'correspondance': 'correspondence',
  'performence': 'performance',
  'permanant': 'permanent',
  'relevent': 'relevant',
  'exellent': 'excellent',
  'differance': 'difference',
  'importent': 'important',
  'signifigant': 'significant',
  'intellegent': 'intelligent',
  'convinient': 'convenient',
  
  // Common typing errors and misspellings
  'becuase': 'because',
  'bussiness': 'business',
  'concious': 'conscious',
  'dosent': "doesn't",
  'enviroment': 'environment',
  'experiance': 'experience',
  'futher': 'further',
  'garentee': 'guarantee',
  'happend': 'happened',
  'immediatly': 'immediately',
  'intresting': 'interesting',
  'knowlege': 'knowledge',
  'lenght': 'length',
  'lisence': 'license',
  'millenium': 'millennium',
  'noticable': 'noticeable',
  'posession': 'possession',
  'priviledge': 'privilege',
  'reffered': 'referred',
  'remeber': 'remember',
  'succesful': 'successful',
  'suprise': 'surprise',
  'truely': 'truly',
  'untill': 'until',
  'usefull': 'useful',
  'wether': 'whether',
  'wich': 'which',
  'minumum': 'minimum',
  'maxiumum': 'maximum',
  'realy': 'really',
  'finaly': 'finally',
  'actualy': 'actually',
  'usualy': 'usually',
  'probaly': 'probably',
  'generaly': 'generally',
  'basicaly': 'basically',
  'literaly': 'literally',
  'originaly': 'originally',
  'personaly': 'personally',
  'specialy': 'specially',
  'totaly': 'totally',
  
  // -tion vs -sion confusion
  'discusion': 'discussion',
  'extention': 'extension',
  'dimention': 'dimension',
  'attentoin': 'attention',
  'questoin': 'question',
  'occasoin': 'occasion',
  'profesional': 'professional',
  'commision': 'commission',
  'permision': 'permission',
  'admision': 'admission',
  'omision': 'omission',
  'submision': 'submission',
  
  // Common compound word errors
  'alot': 'a lot',
  'allways': 'always',
  'allready': 'already',
  'alltogether': 'altogether',
  'allmost': 'almost',
  'allright': 'all right',
  'tommorrow': 'tomorrow',
  'reccomend': 'recommend',
  'comittee': 'committee',
  'acording': 'according',
  'agian': 'again',
  'befor': 'before',
  'durring': 'during',
  'gramar': 'grammar',
  'grammer': 'grammar',
  'lazer': 'laser',
  'liscense': 'license',
  'mispell': 'misspell',
  'occassion': 'occasion',
  'occurance': 'occurrence',
  'paralel': 'parallel',
  'privelege': 'privilege',
  'publically': 'publicly',
  'rythm': 'rhythm',
  'seperation': 'separation',
  'speach': 'speech',
  'sucessful': 'successful',
  'tendancy': 'tendency',
  'upto': 'up to',
  'withhold': 'withhold',
  'writen': 'written',
  
  // Technical and business terms
  'sofware': 'software',
  'hardward': 'hardware',
  'databse': 'database',
  'managment': 'management',
  'develope': 'develop',
  'developement': 'development',
  'analysys': 'analysis',
  'anaylsis': 'analysis',
  'analysies': 'analyses',
  'proceedure': 'procedure',
  'proceedures': 'procedures',
  'algoritm': 'algorithm',
  'algorythm': 'algorithm',
  'compatability': 'compatibility',
  'efficency': 'efficiency',
  'performace': 'performance',
  'availibility': 'availability',
  'responsability': 'responsibility',
  'flexability': 'flexibility',
  'visability': 'visibility',
  'accesibility': 'accessibility',
  'maintainablity': 'maintainability',
  'scalibility': 'scalability',
  'reliablity': 'reliability',
  
  // Calendar and time
  'calender': 'calendar',
  'scedule': 'schedule',
  'febuary': 'February',
  'wenesday': 'Wednesday',
  'thuresday': 'Thursday',
  'septemeber': 'September',
  'occuring': 'occurring',
  
  // Numbers and quantities
  'fourty': 'forty',
  'ninty': 'ninety',
  'twelth': 'twelfth',
  'eigth': 'eighth',
  'nineth': 'ninth',
  'fourteenth': 'fourteenth',
  'tweleve': 'twelve',
  'thirten': 'thirteen',
  'forteen': 'fourteen',
  'fiften': 'fifteen',
  'sixten': 'sixteen',
  'seventten': 'seventeen',
  'eightteen': 'eighteen',
  
  // Adjectives with -ful suffix
  'beautifull': 'beautiful',
  'powerfull': 'powerful',
  'carefull': 'careful',
  'hopefull': 'hopeful',
  'meaningfull': 'meaningful',
  'successfull': 'successful',
  'wonderfull': 'wonderful',
  'faithfull': 'faithful',
  'gratefull': 'grateful',
  'peacefull': 'peaceful',
  'playfull': 'playful',
  'colorfull': 'colorful',
  'harmfull': 'harmful',
  'painfull': 'painful',
  'helpfull': 'helpful',
  'forgetfull': 'forgetful',
  'doubtfull': 'doubtful',
  'respectfull': 'respectful',
  'thoughtfull': 'thoughtful'
};

// Enhanced grammar rules for common errors
const grammarRules = [
  // Verb tense consistency
  {
    pattern: /\bi\s+am\s+going\s+to\s+went\b/gi,
    replacement: 'I am going to go',
    explanation: 'Incorrect verb tense combination'
  },
  {
    pattern: /\bI\s+have\s+went\b/gi,
    replacement: 'I have gone',
    explanation: 'Use "gone" with "have" (present perfect tense)'
  },
  {
    pattern: /\bI\s+seen\b/gi,
    replacement: 'I saw',
    explanation: 'Use "saw" for simple past tense'
  },
  {
    pattern: /\bI\s+done\b/gi,
    replacement: 'I did',
    explanation: 'Use "did" for simple past tense'
  },
  
  // Possessive vs contraction errors
  {
    pattern: /\byour\s+welcome\b/gi,
    replacement: "you're welcome",
    explanation: "Use 'you're' (you are) instead of 'your' (possessive)"
  },
  {
    pattern: /\bits\s+a\s+nice\s+day\b/gi,
    replacement: "it's a nice day",
    explanation: "Use 'it's' (it is) instead of 'its' (possessive)"
  },
  {
    pattern: /\bwhose\s+going\b/gi,
    replacement: "who's going",
    explanation: "Use 'who's' (who is) instead of 'whose' (possessive)"
  },
  {
    pattern: /\btheir\s+going\b/gi,
    replacement: "they're going",
    explanation: "Use 'they're' (they are) instead of 'their' (possessive)"
  },
  
  // Subject-verb agreement
  {
    pattern: /\bthere\s+is\s+\d+\s+\w+s\b/gi,
    replacement: "there are [number] [items]",
    explanation: "Use 'there are' with plural subjects"
  },
  {
    pattern: /\beveryone\s+have\b/gi,
    replacement: "everyone has",
    explanation: "'Everyone' is singular and takes 'has'"
  },
  {
    pattern: /\bthe\s+team\s+are\b/gi,
    replacement: "the team is",
    explanation: "Collective nouns like 'team' are usually singular"
  },
  
  // Double negatives
  {
    pattern: /\bdon't\s+have\s+no\b/gi,
    replacement: "don't have any",
    explanation: "Avoid double negatives"
  },
  {
    pattern: /\bcan't\s+get\s+no\b/gi,
    replacement: "can't get any",
    explanation: "Avoid double negatives"
  },
  
  // Comparative and superlative errors
  {
    pattern: /\bmore\s+better\b/gi,
    replacement: "better",
    explanation: "Don't use 'more' with comparative adjectives"
  },
  {
    pattern: /\bmost\s+best\b/gi,
    replacement: "best",
    explanation: "Don't use 'most' with superlative adjectives"
  },
  {
    pattern: /\bmore\s+easier\b/gi,
    replacement: "easier",
    explanation: "Don't use 'more' with comparative adjectives"
  },
  
  // Pronoun errors
  {
    pattern: /\bme\s+and\s+\w+\s+(is|are|was|were)\b/gi,
    replacement: "[Name] and I [verb]",
    explanation: "Use 'I' as a subject, not 'me'"
  },
  {
    pattern: /\bbetween\s+you\s+and\s+I\b/gi,
    replacement: "between you and me",
    explanation: "Use 'me' after prepositions like 'between'"
  },
  
  // Preposition errors
  {
    pattern: /\bdifferent\s+than\b/gi,
    replacement: "different from",
    explanation: "Use 'different from' instead of 'different than'"
  },
  {
    pattern: /\bcould\s+of\b/gi,
    replacement: "could have",
    explanation: "Use 'could have' instead of 'could of'"
  },
  {
    pattern: /\bwould\s+of\b/gi,
    replacement: "would have",
    explanation: "Use 'would have' instead of 'would of'"
  },
  {
    pattern: /\bshould\s+of\b/gi,
    replacement: "should have",
    explanation: "Use 'should have' instead of 'should of'"
  },
  
  // Misused words
  {
    pattern: /\birregardless\b/gi,
    replacement: "regardless",
    explanation: "'Irregardless' is not a standard word; use 'regardless'"
  },
  {
    pattern: /\bsupposably\b/gi,
    replacement: "supposedly",
    explanation: "Use 'supposedly' instead of 'supposably'"
  },
  {
    pattern: /\bfor\s+all\s+intensive\s+purposes\b/gi,
    replacement: "for all intents and purposes",
    explanation: "The correct phrase is 'for all intents and purposes'"
  },
  {
    pattern: /\bnip\s+it\s+in\s+the\s+butt\b/gi,
    replacement: "nip it in the bud",
    explanation: "The correct phrase is 'nip it in the bud'"
  }
];

// Enhanced style suggestions for better writing
const styleSuggestions = [
  // Reduce redundancy and wordiness
  {
    pattern: /\bvery\s+good\b/gi,
    replacement: 'excellent',
    explanation: 'Use more specific adjectives instead of "very + adjective"'
  },
  {
    pattern: /\bvery\s+bad\b/gi,
    replacement: 'terrible',
    explanation: 'Use more specific adjectives instead of "very + adjective"'
  },
  {
    pattern: /\bvery\s+big\b/gi,
    replacement: 'huge',
    explanation: 'Use more specific adjectives instead of "very + adjective"'
  },
  {
    pattern: /\bvery\s+small\b/gi,
    replacement: 'tiny',
    explanation: 'Use more specific adjectives instead of "very + adjective"'
  },
  {
    pattern: /\bin\s+order\s+to\b/gi,
    replacement: 'to',
    explanation: 'Simplify by using "to" instead of "in order to"'
  },
  {
    pattern: /\bdue\s+to\s+the\s+fact\s+that\b/gi,
    replacement: 'because',
    explanation: 'Use "because" for clearer, more concise writing'
  },
  {
    pattern: /\bat\s+this\s+point\s+in\s+time\b/gi,
    replacement: 'now',
    explanation: 'Use "now" instead of the wordy phrase'
  },
  {
    pattern: /\bin\s+the\s+event\s+that\b/gi,
    replacement: 'if',
    explanation: 'Use "if" instead of the wordy phrase'
  },
  {
    pattern: /\bprior\s+to\b/gi,
    replacement: 'before',
    explanation: 'Use "before" instead of "prior to"'
  },
  {
    pattern: /\bsubsequent\s+to\b/gi,
    replacement: 'after',
    explanation: 'Use "after" instead of "subsequent to"'
  },
  {
    pattern: /\bin\s+close\s+proximity\s+to\b/gi,
    replacement: 'near',
    explanation: 'Use "near" instead of the wordy phrase'
  },
  
  // Improve weak verbs
  {
    pattern: /\bthere\s+is\s+\w+\s+that\s+\w+\b/gi,
    replacement: '[subject] [verb]',
    explanation: 'Avoid weak "there is" constructions'
  },
  {
    pattern: /\bit\s+is\s+\w+\s+that\s+\w+\b/gi,
    replacement: '[subject] [verb]',
    explanation: 'Avoid weak "it is" constructions'
  },
  
  // Passive voice suggestions
  {
    pattern: /\bwas\s+\w+ed\s+by\b/gi,
    replacement: '[subject] [verb]',
    explanation: 'Consider using active voice instead of passive voice'
  },
  {
    pattern: /\bwere\s+\w+ed\s+by\b/gi,
    replacement: '[subject] [verb]',
    explanation: 'Consider using active voice instead of passive voice'
  },
  
  // Cliché phrases
  {
    pattern: /\bat\s+the\s+end\s+of\s+the\s+day\b/gi,
    replacement: 'ultimately',
    explanation: 'Avoid clichés; use more precise language'
  },
  {
    pattern: /\bthink\s+outside\s+the\s+box\b/gi,
    replacement: 'be creative',
    explanation: 'Avoid clichés; use more precise language'
  },
  {
    pattern: /\blow\s+hanging\s+fruit\b/gi,
    replacement: 'easy opportunities',
    explanation: 'Avoid clichés; use more precise language'
  },
  {
    pattern: /\btouch\s+base\b/gi,
    replacement: 'contact',
    explanation: 'Use more direct language instead of business jargon'
  },
  {
    pattern: /\bcircle\s+back\b/gi,
    replacement: 'follow up',
    explanation: 'Use more direct language instead of business jargon'
  },
  
  // Hedge words that weaken writing
  {
    pattern: /\bI\s+think\s+that\b/gi,
    replacement: 'I believe',
    explanation: 'Use stronger, more confident language'
  },
  {
    pattern: /\bkind\s+of\b/gi,
    replacement: 'somewhat',
    explanation: 'Use more precise language instead of vague qualifiers'
  },
  {
    pattern: /\bsort\s+of\b/gi,
    replacement: 'somewhat',
    explanation: 'Use more precise language instead of vague qualifiers'
  },
  
  // Redundant phrases
  {
    pattern: /\bfuture\s+plans\b/gi,
    replacement: 'plans',
    explanation: 'Plans are inherently future-oriented; avoid redundancy'
  },
  {
    pattern: /\bfree\s+gift\b/gi,
    replacement: 'gift',
    explanation: 'Gifts are inherently free; avoid redundancy'
  },
  {
    pattern: /\badvance\s+warning\b/gi,
    replacement: 'warning',
    explanation: 'Warnings are inherently given in advance; avoid redundancy'
  },
  {
    pattern: /\bexact\s+same\b/gi,
    replacement: 'same',
    explanation: 'Same implies exactness; avoid redundancy'
  },
  {
    pattern: /\bunexpected\s+surprise\b/gi,
    replacement: 'surprise',
    explanation: 'Surprises are inherently unexpected; avoid redundancy'
  }
];

// Function to check for local spelling errors
const checkLocalSpelling = (text: string): Suggestion[] => {
  const words = text.split(/\b/);
  const suggestions: Suggestion[] = [];
  let currentIndex = 0;

  words.forEach((word: string) => {
    const lowerWord = word.toLowerCase();
    if (spellCheckDict[lowerWord]) {
      suggestions.push({
        id: `local-${currentIndex}`,
        type: 'spelling',
        text: word,
        replacement: spellCheckDict[lowerWord],
        explanation: 'Common misspelling detected',
        startIndex: currentIndex,
        endIndex: currentIndex + word.length,
        severity: 'error'
      });
    }
    currentIndex += word.length;
  });

  return suggestions;
};

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [text, setText] = useState("Welcome to your writing assistant! Try typing some text with mistakes like 'teh' or 'recieve' to see suggestions appear.");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showSuggestionPanel, setShowSuggestionPanel] = useState(true);
  const [floatingSuggestion, setFloatingSuggestion] = useState<Suggestion | null>(null);
  const [floatingPosition, setFloatingPosition] = useState<{ x: number; y: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredSuggestion, setHoveredSuggestion] = useState<Suggestion | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showSuggestionNotification, setShowSuggestionNotification] = useState(false);
  const [floatingSuggestionsEnabled, setFloatingSuggestionsEnabled] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const generateSuggestions = useCallback(async (inputText: string): Promise<Suggestion[]> => {
    try {
      const response = await fetch('/api/correct-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const data = await response.json();
      return data.suggestions;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    const getSuggestions = async () => {
      setIsLoading(true);
      try {
        // First check for local spelling errors
        const localSuggestions = checkLocalSpelling(text);
        
        // Then get API suggestions
        const apiSuggestions = await generateSuggestions(text);
        
        // Combine both sets of suggestions, removing duplicates
        const allSuggestions = [...localSuggestions];
        apiSuggestions.forEach((apiSuggestion: Suggestion) => {
          const isDuplicate = localSuggestions.some(
            (localSuggestion: Suggestion) => 
              localSuggestion.startIndex === apiSuggestion.startIndex &&
              localSuggestion.endIndex === apiSuggestion.endIndex
          );
          if (!isDuplicate) {
            allSuggestions.push(apiSuggestion);
          }
        });
        
        setSuggestions(allSuggestions);
        
        // Show notification for new suggestions
        if (allSuggestions.length > 0) {
          setShowSuggestionNotification(true);
          setTimeout(() => setShowSuggestionNotification(false), 3000);
        }
        
        // Auto-show floating suggestion for the first critical error (only if enabled)
        const firstError = allSuggestions.find(s => s.severity === 'error');
        if (firstError && !floatingSuggestion && textareaRef.current && allSuggestions.length > 0 && floatingSuggestionsEnabled) {
          const textarea = textareaRef.current;
          const rect = textarea.getBoundingClientRect();
          const textBeforeError = text.substring(0, firstError.startIndex);
          const lines = textBeforeError.split('\n');
          const currentLine = lines.length - 1;
          const currentColumn = lines[lines.length - 1].length;
          
          const lineHeight = 28;
          const charWidth = 11;
          
          const x = rect.left + 24 + (currentColumn * charWidth);
          const y = rect.top + 24 + (currentLine * lineHeight);
          
          // Delay showing the floating suggestion to avoid interference with typing
          setTimeout(() => {
            if (allSuggestions.some(s => s.id === firstError.id) && floatingSuggestionsEnabled) {
              setFloatingSuggestion(firstError);
              setFloatingPosition({ x, y });
            }
          }, 1500); // 1.5 second delay
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    if (text.trim()) {
      const timeoutId = setTimeout(getSuggestions, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setFloatingSuggestion(null);
      setFloatingPosition(null);
    }
  }, [text, generateSuggestions, floatingSuggestion]);

  const applySuggestion = (suggestion: Suggestion) => {
    const newText = text.substring(0, suggestion.startIndex) + 
                   suggestion.replacement + 
                   text.substring(suggestion.endIndex);
    setText(newText);
    
    // Calculate the length difference to adjust other suggestions
    const lengthDifference = suggestion.replacement.length - (suggestion.endIndex - suggestion.startIndex);
    
    // Update positions of remaining suggestions that come after the applied one
    setSuggestions((prev: Suggestion[]) => {
      return prev
        .filter((s: Suggestion) => s.id !== suggestion.id) // Remove applied suggestion
        .map((s: Suggestion) => {
          // Only adjust suggestions that come after the applied one
          if (s.startIndex > suggestion.endIndex) {
            return {
              ...s,
              startIndex: s.startIndex + lengthDifference,
              endIndex: s.endIndex + lengthDifference
            };
          }
          return s;
        });
    });
    
    // Clear any floating suggestion if it matches the applied one
    if (floatingSuggestion && floatingSuggestion.id === suggestion.id) {
      setFloatingSuggestion(null);
      setFloatingPosition(null);
    }
    
    setSelectedSuggestion(null);
    setShowSuggestionModal(false);
  };

  const applyAllSuggestions = () => {
    // Sort suggestions by startIndex in descending order to avoid position conflicts
    const sortedSuggestions = [...suggestions].sort((a, b) => b.startIndex - a.startIndex);
    
    let updatedText = text;
    
    // Apply all suggestions from end to beginning
    sortedSuggestions.forEach((suggestion) => {
      updatedText = updatedText.substring(0, suggestion.startIndex) + 
                   suggestion.replacement + 
                   updatedText.substring(suggestion.endIndex);
    });
    
    setText(updatedText);
    setSuggestions([]);
    setFloatingSuggestion(null);
    setFloatingPosition(null);
    setSelectedSuggestion(null);
    setShowSuggestionModal(false);
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions((prev: Suggestion[]) => prev.filter((s: Suggestion) => s.id !== suggestionId));
    setSelectedSuggestion(null);
    setShowSuggestionModal(false);
  };

  const handleTextClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!floatingSuggestionsEnabled) return;
    
    const textarea = e.currentTarget;
    const clickPosition = textarea.selectionStart;
    
    const clickedSuggestion = suggestions.find(s => 
      clickPosition >= s.startIndex && clickPosition <= s.endIndex
    );
    
    if (clickedSuggestion) {
      const rect = textarea.getBoundingClientRect();
      const textBeforeClick = text.substring(0, clickPosition);
      const lines = textBeforeClick.split('\n');
      const currentLine = lines.length - 1;
      const currentColumn = lines[lines.length - 1].length;
      
      // Approximate position calculation
      const lineHeight = 28; // Based on text-lg leading-relaxed
      const charWidth = 11; // Approximate character width for monospace
      
      const x = rect.left + 24 + (currentColumn * charWidth); // 24px padding
      const y = rect.top + 24 + (currentLine * lineHeight); // 24px padding
      
      setFloatingSuggestion(clickedSuggestion);
      setFloatingPosition({ x, y });
    } else {
      setFloatingSuggestion(null);
      setFloatingPosition(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!floatingSuggestionsEnabled) return;
    
    const textarea = e.currentTarget;
    const rect = textarea.getBoundingClientRect();
    
    // More accurate position calculation using textarea properties
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Create a temporary span to measure character positions
    const textareaStyle = window.getComputedStyle(textarea);
    const fontSize = parseFloat(textareaStyle.fontSize);
    const lineHeight = parseFloat(textareaStyle.lineHeight) || fontSize * 1.4;
    
    // Account for padding
    const paddingLeft = parseFloat(textareaStyle.paddingLeft);
    const paddingTop = parseFloat(textareaStyle.paddingTop);
    
    const adjustedX = clickX - paddingLeft;
    const adjustedY = clickY - paddingTop;
    
    // Estimate character position
    const charWidth = fontSize * 0.6; // Approximate for monospace
    const lineIndex = Math.floor(adjustedY / lineHeight);
    const charIndex = Math.floor(adjustedX / charWidth);
    
    const lines = text.split('\n');
    if (lineIndex >= 0 && lineIndex < lines.length) {
      let textPosition = 0;
      for (let i = 0; i < lineIndex; i++) {
        textPosition += lines[i].length + 1; // +1 for newline
      }
      textPosition += Math.min(Math.max(charIndex, 0), lines[lineIndex].length);
      
      const hoveredSuggestion = suggestions.find(s => 
        textPosition >= s.startIndex && textPosition <= s.endIndex
      );
      
      if (hoveredSuggestion && hoveredSuggestion.severity === 'error') {
        // Clear any existing timeout
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
        }
        
        // Set a new timeout for showing the suggestion
        const timeout = setTimeout(() => {
          if (floatingSuggestionsEnabled) {
            setFloatingSuggestion(hoveredSuggestion);
            setFloatingPosition({ x: e.clientX, y: e.clientY - 10 });
            setHoveredSuggestion(hoveredSuggestion);
          }
        }, 800); // 800ms delay before showing
        
        setHoverTimeout(timeout);
      } else if (!hoveredSuggestion) {
        // Clear timeout if not hovering over a suggestion
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
          setHoverTimeout(null);
        }
        
        // Hide floating suggestion after a short delay if we're not hovering over it
        const hideTimeout = setTimeout(() => {
          if (!hoveredSuggestion) {
            setFloatingSuggestion(null);
            setFloatingPosition(null);
            setHoveredSuggestion(null);
          }
        }, 300);
        
        setHoverTimeout(hideTimeout);
      }
    }
  };

  const handleMouseLeave = () => {
    // Clear any pending hover timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    
    // Hide floating suggestion after a delay
    const hideTimeout = setTimeout(() => {
      setFloatingSuggestion(null);
      setFloatingPosition(null);
      setHoveredSuggestion(null);
    }, 300);
    
    setHoverTimeout(hideTimeout);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // Hide floating suggestions when toggle is turned off
  useEffect(() => {
    if (!floatingSuggestionsEnabled) {
      setFloatingSuggestion(null);
      setFloatingPosition(null);
      setHoveredSuggestion(null);
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
    }
  }, [floatingSuggestionsEnabled, hoverTimeout]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + F to fix first error
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        const firstError = suggestions.find(s => s.severity === 'error');
        if (firstError) {
          applySuggestion(firstError);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [suggestions]);

  const renderTextWithHighlights = () => {
    if (suggestions.length === 0) return text;

    let result = '';
    let lastIndex = 0;

    suggestions.forEach((suggestion) => {
      result += text.substring(lastIndex, suggestion.startIndex);
      
      const highlightClass = suggestion.severity === 'error' 
        ? 'bg-red-100 border-b-2 border-red-500 dark:bg-red-900/20 dark:border-red-400 hover:bg-red-200 dark:hover:bg-red-800/30 text-red-800 dark:text-red-200 hover:shadow-sm transition-all duration-200 cursor-help' 
        : suggestion.severity === 'warning'
        ? 'bg-yellow-100 border-b-2 border-yellow-500 dark:bg-yellow-900/20 dark:border-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-800/30 text-yellow-800 dark:text-yellow-200 hover:shadow-sm transition-all duration-200 cursor-help'
        : 'bg-blue-100 border-b-2 border-blue-500 dark:bg-blue-900/20 dark:border-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/30 text-blue-800 dark:text-blue-200 hover:shadow-sm transition-all duration-200 cursor-help';
      
      result += `<span class="${highlightClass} cursor-pointer transition-colors" data-suggestion-id="${suggestion.id}">${suggestion.text}</span>`;
      lastIndex = suggestion.endIndex;
    });
    
    result += text.substring(lastIndex);
    return result;
  };

  const applyFloatingSuggestion = (suggestion: Suggestion) => {
    applySuggestion(suggestion);
    setFloatingSuggestion(null);
    setFloatingPosition(null);
  };

  const dismissFloatingSuggestion = (suggestionId: string) => {
    dismissSuggestion(suggestionId);
    setFloatingSuggestion(null);
    setFloatingPosition(null);
  };

  const closeFloatingSuggestion = () => {
    setFloatingSuggestion(null);
    setFloatingPosition(null);
  };

  const handleFloatingSuggestionMouseEnter = () => {
    // Keep the floating suggestion visible when hovering over it
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
  };

  const handleFloatingSuggestionMouseLeave = () => {
    // Hide floating suggestion when mouse leaves the suggestion popup
    const hideTimeout = setTimeout(() => {
      setFloatingSuggestion(null);
      setFloatingPosition(null);
      setHoveredSuggestion(null);
    }, 300);
    
    setHoverTimeout(hideTimeout);
  };

  const getSuggestionIcon = (type: string, severity: string) => {
    if (severity === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (severity === 'warning') return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <Lightbulb className="w-4 h-4 text-blue-500" />;
  };

  const getSuggestionBadgeVariant = (severity: string) => {
    if (severity === 'error') return 'destructive';
    if (severity === 'warning') return 'secondary';
    return 'default';
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(text);
  };

  const handleClearText = () => {
    setText("");
    setSuggestions([]);
  };

  const getTextStats = () => {
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const characters = text.length;
    return {
      words: words.length,
      characters
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Writing Assistant</h1>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm">
                {getTextStats().words} words
              </Badge>
              <Badge variant="outline" className="text-sm">
                {getTextStats().characters} characters
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="floating-suggestions"
                checked={floatingSuggestionsEnabled}
                onCheckedChange={setFloatingSuggestionsEnabled}
              />
              <Label htmlFor="floating-suggestions" className="text-sm font-medium">
                Floating Suggestions
              </Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyToClipboard}
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Copy</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearText}
              className="flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Clear</span>
            </Button>
            {suggestions.length > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={applyAllSuggestions}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Fix All ({suggestions.length})</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSuggestionPanel(!showSuggestionPanel)}
              className="flex items-center space-x-2"
            >
              {showSuggestionPanel ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  <span>Hide Suggestions</span>
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  <span>Show Suggestions</span>
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
              title="Hover over red underlined text for quick suggestions. Press Ctrl+Shift+F to fix first error."
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onClick={handleTextClick}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className="w-full h-[500px] p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-lg leading-relaxed relative z-10"
                    placeholder="Start typing your text here..."
                  />
                  
                  {/* Overlay for highlighting */}
                  <div 
                    ref={overlayRef}
                    className="absolute inset-0 p-4 text-lg leading-relaxed pointer-events-none whitespace-pre-wrap font-mono text-transparent z-0"
                    dangerouslySetInnerHTML={{ __html: renderTextWithHighlights() }}
                  />
                  
                  {isLoading && (
                    <div className="absolute top-4 right-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                  
                  {/* Suggestion Notification */}
                  <AnimatePresence>
                    {showSuggestionNotification && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {suggestions.filter(s => s.severity === 'error').length > 0 
                            ? `${suggestions.filter(s => s.severity === 'error').length} error${suggestions.filter(s => s.severity === 'error').length > 1 ? 's' : ''} found`
                            : `${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''} available`
                          }
                        </span>
                        <span className="text-xs opacity-80">Hover over red text for quick fixes</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>

          {showSuggestionPanel && (
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Suggestions</span>
                    {suggestions.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {suggestions.length}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {suggestions.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span>Analyzing text...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2">
                          <CheckCircle className="h-8 w-8 text-green-500" />
                          <p>No suggestions found</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {suggestions.map((suggestion) => (
                        <div
                          key={suggestion.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            setSelectedSuggestion(suggestion);
                            setShowSuggestionModal(true);
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            {getSuggestionIcon(suggestion.type, suggestion.severity)}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{suggestion.text}</span>
                                <span className="text-gray-500">→</span>
                                <span className="text-blue-600">{suggestion.replacement}</span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">{suggestion.explanation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Floating Suggestion */}
      {floatingSuggestionsEnabled && (
        <FloatingSuggestion
          suggestion={floatingSuggestion}
          position={floatingPosition}
          onApply={applyFloatingSuggestion}
          onDismiss={dismissFloatingSuggestion}
          onClose={closeFloatingSuggestion}
          onMouseEnter={handleFloatingSuggestionMouseEnter}
          onMouseLeave={handleFloatingSuggestionMouseLeave}
        />
      )}

      {/* Suggestion Modal */}
      <Dialog open={showSuggestionModal} onOpenChange={setShowSuggestionModal}>
        <DialogContent className="sm:max-w-md">
          {selectedSuggestion && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  {getSuggestionIcon(selectedSuggestion.type, selectedSuggestion.severity)}
                  <span className="capitalize">{selectedSuggestion.type} Suggestion</span>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="text-sm text-muted-foreground mb-2">Current text:</div>
                  <div className="font-medium text-red-600 dark:text-red-400">
                    "{selectedSuggestion.text}"
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="text-sm text-muted-foreground mb-2">Suggested replacement:</div>
                  <div className="font-medium text-green-600 dark:text-green-400">
                    "{selectedSuggestion.replacement}"
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="text-sm text-muted-foreground mb-2">Explanation:</div>
                  <div className="text-sm">{selectedSuggestion.explanation}</div>
                </div>
                
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => applySuggestion(selectedSuggestion)}
                    className="flex-1"
                  >
                    Apply Suggestion
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => dismissSuggestion(selectedSuggestion.id)}
                    className="flex-1"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}