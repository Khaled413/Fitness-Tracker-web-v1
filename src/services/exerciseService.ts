import { Pose, calculateAngle, getKeypoint, calculateVerticalDistance, calculateHorizontalDistance } from './poseDetectionService';

// Exercise types supported by the app
export enum ExerciseType {
  SQUAT = 'squat',
  BICEP_CURL = 'bicepCurl',
  // SHOULDER_PRESS = 'shoulderPress', // Removed
  PUSH_UP = 'pushUp', // Added
  PULL_UP = 'pullUp', // Added
  FORWARD_LUNGE = 'forwardLunge', // Adding new exercise
  NONE = 'none'
}

// State of a single exercise repetition
export enum RepState {
  STARTING = 'starting',
  UP = 'up',
  DOWN = 'down',
  COUNTING = 'counting',
  RESTING = 'resting',
  INCORRECT_FORM = 'incorrectForm'
}

// Interface for exercise settings
export interface ExerciseSettings {
  name: string;
  type: ExerciseType;
  targetReps: number;
  restBetweenSets: number; // in seconds
  sets: number;
  thresholds: {
    upAngle: number;
    downAngle: number;
    // Additional thresholds for form correctness
    backAngleMin?: number;
    backAngleMax?: number; // Added
    kneePositionThreshold?: number;
    upperArmMovementMax?: number; // Added for Bicep Curl
    kneeValgusCheck?: boolean; // Added for Squat
    chestForwardCheck?: boolean; // Added for Squat
    bodyLineAngleRange?: [number, number]; // Added for Push Up
    chinAboveWristRequired?: boolean; // Added for Pull Up
  };
  formInstructions: string[];
  musclesTargeted: string[];
  primaryLandmarks: string[]; // Primary landmarks to track for this exercise
}

// Exercise definitions
export const EXERCISES: Record<ExerciseType, ExerciseSettings> = {
  [ExerciseType.SQUAT]: {
    name: 'Squat',
    type: ExerciseType.SQUAT,
    targetReps: 15,
    restBetweenSets: 10,
    sets: 3,
    thresholds: {
      // Up Phase
      upAngle: 160, // Knee angle when standing (≥160° as per specs)
      // Down Phase
      downAngle: 105, // Knee angle when squatting (≤105° as per specs)
      // Torso angle limits
      backAngleMin: 0, // Minimum torso angle from vertical
      backAngleMax: 20, // Maximum torso angle from vertical (0°-20° as per specs)
      // Knee alignment threshold
      kneePositionThreshold: 0.15, // Threshold for knee tracking over foot (±15% leg length)
      // Additional thresholds based on specs
      hipDropPercentage: 0.25, // Hips drop ≥25% leg length
      shoulderLevelThreshold: 0.05, // Shoulders level (left-right height difference <5% body height)
      minKneeAngleUp: 160, // Minimum knee angle for UP phase
      maxKneeAngleDown: 105, // Maximum knee angle for DOWN phase
      minHipAngleUp: 160, // Minimum hip angle for UP phase
      maxHipAngleDown: 105, // Maximum hip angle for DOWN phase
      spineAngleMax: 10, // Maximum spine deviation from neutral (<10° as per specs)
      kneeValgusCheck: true, // Check for knees caving in
      chestForwardCheck: true, // Check for excessive forward lean
    },
    formInstructions: [
      'Stand with feet shoulder-width apart',
      'Keep your back straight, chest up',
      'Lower until thighs are parallel to the ground (knee angle ~90°)',
      'Ensure knees track over toes, not caving inward',
      'Maintain weight primarily in heels/midfoot',
      'Return to standing position with knees and hips fully extended'
    ],
    musclesTargeted: ['Quadriceps', 'Hamstrings', 'Glutes', 'Core'],
    primaryLandmarks: ['left_hip', 'left_knee', 'left_ankle', 'right_hip', 'right_knee', 'right_ankle', 'left_shoulder', 'right_shoulder']
  },
  [ExerciseType.BICEP_CURL]: {
    name: 'Bicep Curl',
    type: ExerciseType.BICEP_CURL,
    targetReps: 12, // Default, can be adjusted
    restBetweenSets: 10, // Default, can be adjusted
    sets: 3, // Default, can be adjusted
    thresholds: {
      upAngle: 55, // Changed (from 45) - Angle at top of curl (contracted)
      downAngle: 160, // Changed (from 160) - Angle at bottom of curl (extended)
      backAngleMax: 20, // Added - Max back angle deviation allowed
      upperArmMovementMax: 200, // Added - Max upper arm movement allowed
    },
    formInstructions: [
      'Keep elbows tucked close to your sides',
      'Minimize upper arm movement; isolate the bicep',
      'Curl weight up towards shoulder (elbow angle ~55°)',
      'Lower weight slowly until arms are nearly straight (elbow angle ~155°)'
    ],
    musclesTargeted: ['Biceps', 'Forearms'],
    primaryLandmarks: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist']
  },
  // [ExerciseType.SHOULDER_PRESS]: { ... } // Removed
  [ExerciseType.PUSH_UP]: {
    name: 'Push Up',
    type: ExerciseType.PUSH_UP,
    targetReps: 15,
    restBetweenSets: 10,
    sets: 3,
    thresholds: {
      // Up Phase
      upAngle: 170, // Elbow angle when arms are extended (170°-180°)
      // Down Phase
      downAngle: 105, // Maximum elbow angle for down position (75°-105°)
      // Body alignment
      bodyLineAngleRange: [175, 185], // Allowed angle range for shoulder-hip-knee (0°-5° from straight line)
      // Additional thresholds based on specs
      minElbowAngleDown: 75, // Minimum elbow angle for DOWN phase
      maxElbowAngleDown: 105, // Maximum elbow angle for DOWN phase
      minElbowAngleUp: 160, // Minimum elbow angle for UP phase
      shoulderAngleDown: [30, 75], // Shoulder angle range in DOWN phase
      shoulderAngleUp: [0, 10], // Shoulder angle range in UP phase
      headAngleMax: 10, // Maximum head/neck angle from neutral
      handPositionThreshold: 0.1, // Hands under shoulders (±10% body width)
      minChestDropPercentage: 0.2, // Chest drops ≥20% arm length
      torsoAngleMax: 5, // Maximum torso deviation from horizontal
      elbowAngleOutMax: 75, // Maximum elbow angle from body (flared elbows)
      consecutiveErrorThreshold: 3, // Flag errors after 3+ consecutive occurrences
    },
    formInstructions: [
      'Place hands slightly wider than shoulder-width',
      'Keep body in a straight line from head to heels',
      'Lower chest towards the floor (elbow angle ~90°)',
      'Push back up until arms are extended (elbow angle ~170°)',
      'Keep elbows tucked at ~45° angle to body',
      'Maintain neutral head position, looking slightly forward'
    ],
    musclesTargeted: ['Chest', 'Shoulders', 'Triceps', 'Core'],
    primaryLandmarks: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist', 'left_hip', 'right_hip', 'left_knee', 'right_knee', 'nose']
  },
  [ExerciseType.PULL_UP]: {
    name: 'Pull Up',
    type: ExerciseType.PULL_UP,
    targetReps: 15, // Example value
    restBetweenSets: 10, // Example value
    sets: 3, // Example value
    thresholds: {
      upAngle: 100, // Elbow angle when arms are extended
      downAngle: 95, // Elbow angle when chest is near floor
      bodyLineAngleRange: [150, 190], // Require chin to clear bar height
    },
    formInstructions: [
      'Grip bar slightly wider than shoulder-width, palms facing away',
      'Hang with arms fully extended',
      'Pull body up until chin is above the bar (elbow angle ~80°)',
      'Lower body slowly until arms are fully extended (elbow angle ~160°)',
      'Avoid excessive swinging or kipping',
    ],
    musclesTargeted: ['Back (Lats)', 'Biceps', 'Shoulders', 'Core'],
    primaryLandmarks: ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist', 'nose'] // Nose/wrist relation for chin check
  },
  [ExerciseType.FORWARD_LUNGE]: {
    name: 'Forward Lunge',
    type: ExerciseType.FORWARD_LUNGE,
    targetReps: 12,
    restBetweenSets: 10,
    sets: 3,
    thresholds: {
      // Up Phase (Standing)
      upAngle: 170, // Standing position (knee angle 170°-180°)
      // Down Phase (Lunge)
      downAngle: 90, // Lunge position (front knee bent 90° ± 10°)
      backAngleMax: 10, // Max torso lean from vertical (degrees)
      kneePositionThreshold: 0.1, // Threshold for knee tracking over foot (within ±10% leg length)
      bodyLineAngleRange: [80, 100], // Range for back knee angle
      // Additional thresholds
      hipDropPercentage: 0.35, // Hips drop ~30-40% of leg length
      shoulderLevelThreshold: 0.05, // Shoulders level (left-right height difference <5% body height)
      minDepthAngle: 100, // For depth feedback (if front knee >100°)
      minHipDropPercentage: 0.2, // For depth feedback (if hips drop <20%)
    },
    formInstructions: [
      'Stand upright with feet together',
      'Step forward with one leg, bending front knee to 90°',
      'Keep your back straight, torso upright',
      'Ensure front knee stays over ankle, not past toes',
      'Back knee should bend to 80°-100°, hovering above ground',
      'Return to standing position with feet together',
      'Maintain level shoulders throughout the movement'
    ],
    musclesTargeted: ['Quadriceps', 'Hamstrings', 'Glutes', 'Hip Flexors', 'Core'],
    primaryLandmarks: [
      'left_hip', 'right_hip', 
      'left_knee', 'right_knee', 
      'left_ankle', 'right_ankle', 
      'left_shoulder', 'right_shoulder'
    ]
  },
  
  [ExerciseType.NONE]: {
    name: 'None',
    type: ExerciseType.NONE,
    targetReps: 0,
    restBetweenSets: 0,
    sets: 0,
    thresholds: {
      upAngle: 0,
      downAngle: 0,
    },
    formInstructions: [],
    musclesTargeted: [],
    primaryLandmarks: []
  }
};

// Interface for tracking exercise state
export interface ExerciseState {
  type: ExerciseType;
  repCount: number;
  setCount: number;
  repState: RepState;
  formFeedback: string[];
  lastRepTimestamp: number;
  formCorrect: boolean; // Track if current form is correct
  formIssues: Record<string, boolean>; // Track specific form issues by body part or issue type
  totalReps: number; // Total number of reps across all sets
  correctFormCount: number; // Count of reps performed with correct form
  // New properties for enhanced tracking
  startingHipHeight?: number; // Store starting hip height for drop calculation
  shallowSquatCount?: number; // Count consecutive shallow squats
  formErrorCounts?: Record<string, number>; // Track repeated errors
  startingChestHeight?: number; // Store starting chest height for push-up depth
  consecutiveErrors?: Record<string, number>; // Track consecutive errors by type
}

// Initialize a new exercise state
export function initExerciseState(type: ExerciseType): ExerciseState {
  return {
    type,
    repCount: 0,
    setCount: 0, // <-- Change this from 1 to 0
    repState: RepState.STARTING,
    formFeedback: [],
    lastRepTimestamp: Date.now(),
    formCorrect: true,
    formIssues: {},
    totalReps: 0,
    correctFormCount: 0
  };
}

// Process exercise state based on pose data
export function processExerciseState(
  currentState: ExerciseState,
  pose: Pose | null
): ExerciseState {
  if (!pose || currentState.type === ExerciseType.NONE) {
    return currentState;
  }
  
  // Clone the current state to avoid mutations
  const newState = { ...currentState };
  newState.formFeedback = []; // Clear previous feedback
  newState.formCorrect = true; // Start with assumption that form is correct
  newState.formIssues = {}; // Reset form issues
  
  const exerciseSettings = EXERCISES[currentState.type];
  
  // Exercise-specific logic
  // Exercise-specific logic
  switch (currentState.type) {
    case ExerciseType.SQUAT:
      return processSquat(newState, pose, exerciseSettings);
    
    case ExerciseType.BICEP_CURL:
      return processBicepCurl(newState, pose, exerciseSettings);
    
    // case ExerciseType.SHOULDER_PRESS: // Removed
    //   return processShoulderPress(newState, pose, exerciseSettings);

    case ExerciseType.PUSH_UP:
      return processPushUp(newState, pose, exerciseSettings);

    case ExerciseType.PULL_UP:
      return processPullUp(newState, pose, exerciseSettings);

    case ExerciseType.FORWARD_LUNGE:
      return processForwardLunge(newState, pose, exerciseSettings);
    
    default:
      return newState;
  }
}

// Process squat exercise
function processSquat(
  state: ExerciseState,
  pose: Pose,
  settings: ExerciseSettings
): ExerciseState {
  // Get primary landmarks for squats
  const leftHip = getKeypoint(pose, 'left_hip');
  const leftKnee = getKeypoint(pose, 'left_knee');
  const leftAnkle = getKeypoint(pose, 'left_ankle');
  const leftShoulder = getKeypoint(pose, 'left_shoulder');
  const rightHip = getKeypoint(pose, 'right_hip');
  const rightKnee = getKeypoint(pose, 'right_knee');
  const rightAnkle = getKeypoint(pose, 'right_ankle');
  const rightShoulder = getKeypoint(pose, 'right_shoulder');

  if (!leftHip || !leftKnee || !leftAnkle || !leftShoulder || !rightHip || !rightKnee || !rightAnkle || !rightShoulder) {
    state.formFeedback.push('لا يمكن اكتشاف الساقين والجذع بوضوح');
    state.formCorrect = false;
    return state;
  }

  // Initialize consecutive errors tracking if not present
  if (!state.consecutiveErrors) {
    state.consecutiveErrors = {};
  }

  // Calculate key angles for squat form (average of both sides)
  const leftKneeAngle = calculateAngle(leftHip, leftKnee, leftAnkle);
  const rightKneeAngle = calculateAngle(rightHip, rightKnee, rightAnkle);
  const kneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  // Calculate hip angles (torso-thigh)
  const leftHipAngle = calculateAngle(leftShoulder, leftHip, leftKnee);
  const rightHipAngle = calculateAngle(rightShoulder, rightHip, rightKnee);
  const hipAngle = (leftHipAngle + rightHipAngle) / 2;

  // Calculate back angle relative to vertical (average of both sides)
  const leftBackAngleVertical = calculateAngle(leftShoulder, leftHip, { x: leftHip.x, y: leftHip.y + 100 }); // Angle with vertical line down
  const rightBackAngleVertical = calculateAngle(rightShoulder, rightHip, { x: rightHip.x, y: rightHip.y + 100 });
  const backAngleDeviation = ( (180 - leftBackAngleVertical) + (180 - rightBackAngleVertical) ) / 2; // Deviation from straight up (0 degrees)

  // Calculate hip drop percentage (if we have a starting hip height)
  const hipHeight = (leftHip.y + rightHip.y) / 2;
  const legLength = Math.abs((leftHip.y + rightHip.y) / 2 - (leftAnkle.y + rightAnkle.y) / 2);
  const hipDropPercentage = state.startingHipHeight ? (state.startingHipHeight - hipHeight) / legLength : 0;
  
  // Store starting hip height if not already set
  if (!state.startingHipHeight && state.repState === RepState.STARTING) {
    state.startingHipHeight = hipHeight;
  }
  
  // Check shoulder level
  const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y);
  const bodyHeight = Math.abs(((leftShoulder.y + rightShoulder.y) / 2) - ((leftAnkle.y + rightAnkle.y) / 2));
  const shoulderLevelPercentage = shoulderHeightDiff / bodyHeight;

  // Reset form correctness for this frame
  state.formCorrect = true;
  state.formFeedback = [];
  state.formIssues = {}; // Clear previous issues

  // تحسين: استخدام مزيج من زاوية الركبة ونسبة انخفاض الورك لتحديد العمق
  const isDeepEnough = (kneeAngle <= settings.thresholds.maxKneeAngleDown + 10) || 
                      (hipDropPercentage >= settings.thresholds.hipDropPercentage - 0.05);

  // Determine if this is a valid rep attempt (for error flagging)
  const isValidRepAttempt = (state.repState === RepState.DOWN && isDeepEnough) ||
                           (state.repState === RepState.UP && kneeAngle >= settings.thresholds.minKneeAngleUp - 10);

  // Check if back is straight enough (deviation from vertical)
  if (isValidRepAttempt && backAngleDeviation > settings.thresholds.backAngleMax) {
    state.consecutiveErrors['backAngle'] = (state.consecutiveErrors['backAngle'] || 0) + 1;
    
    if (state.consecutiveErrors['backAngle'] >= 2) { // تحسين: تقليل عدد الأخطاء المتتالية من 3 إلى 2
      state.formFeedback.push(backAngleDeviation > 30 ? 
        'ارفع صدرك، قلل الميل للأمام' : 
        `صدرك للأعلى، قلل الميل. الزاوية: ${backAngleDeviation.toFixed(0)}°`);
      state.formCorrect = false;
      state.formIssues['left_hip'] = true;
      state.formIssues['right_hip'] = true;
      state.formIssues['left_shoulder'] = true;
      state.formIssues['right_shoulder'] = true;
    }
  } else {
    state.consecutiveErrors['backAngle'] = 0;
  }

  // Knee Valgus Check (knees caving in/out)
  if (isValidRepAttempt && settings.thresholds.kneeValgusCheck) {
    const legLengthThreshold = legLength * settings.thresholds.kneePositionThreshold;
    const leftKneeValgus = leftKnee.x < leftAnkle.x - legLengthThreshold; // Knee significantly inside ankle
    const rightKneeValgus = rightKnee.x > rightAnkle.x + legLengthThreshold; // Knee significantly outside ankle

    if (leftKneeValgus || rightKneeValgus) {
      state.consecutiveErrors['kneeValgus'] = (state.consecutiveErrors['kneeValgus'] || 0) + 1;
      
      if (state.consecutiveErrors['kneeValgus'] >= 2) { // تحسين: تقليل عدد الأخطاء المتتالية من 3 إلى 2
        state.formFeedback.push('ادفع ركبتيك للخارج، حاذِ فوق قدميك');
        state.formCorrect = false;
        if (leftKneeValgus) state.formIssues['left_knee'] = true;
        if (rightKneeValgus) state.formIssues['right_knee'] = true;
      }
    } else {
      state.consecutiveErrors['kneeValgus'] = 0;
    }
  }

  // Check for uneven shoulders
  if (isValidRepAttempt && shoulderLevelPercentage > settings.thresholds.shoulderLevelThreshold) {
    state.consecutiveErrors['shoulders'] = (state.consecutiveErrors['shoulders'] || 0) + 1;
    
    if (state.consecutiveErrors['shoulders'] >= 2) { // تحسين: تقليل عدد الأخطاء المتتالية من 3 إلى 2
      state.formFeedback.push('حافظ على مستوى كتفيك');
      state.formCorrect = false;
      state.formIssues['left_shoulder'] = true;
      state.formIssues['right_shoulder'] = true;
    }
  } else {
    state.consecutiveErrors['shoulders'] = 0;
  }

  // Check for insufficient depth in DOWN phase
  if (state.repState === RepState.DOWN && !isDeepEnough) {
    state.consecutiveErrors['depth'] = (state.consecutiveErrors['depth'] || 0) + 1;
    
    if (state.consecutiveErrors['depth'] >= 2) { // تحسين: تقليل عدد الأخطاء المتتالية من 3 إلى 2
      state.formFeedback.push('اجلس أعمق، اثنِ ركبتيك إلى 90°');
      state.formCorrect = false;
      state.formIssues['left_knee'] = true;
      state.formIssues['right_knee'] = true;
    }
  } else {
    state.consecutiveErrors['depth'] = 0; // Reset counter if depth is good
  }

  // If form is incorrect and we're not in INCORRECT_FORM state, transition to it
  if (!state.formCorrect && state.repState !== RepState.INCORRECT_FORM &&
      state.repState !== RepState.RESTING && state.repState !== RepState.STARTING) {
    state.repState = RepState.INCORRECT_FORM;
    state.formFeedback.push('صحح وضعيتك لاستمرار عد التكرارات');
    return state;
  }

  // If form was incorrect but is now fixed, return to appropriate state
  if (state.formCorrect && state.repState === RepState.INCORRECT_FORM) {
    // Determine if we should go back to UP or DOWN state based on knee angle
    state.repState = kneeAngle < settings.thresholds.downAngle + 10 ? RepState.DOWN : RepState.UP; // تحسين: زيادة التسامح في زاوية الركبة
    state.formFeedback.push('وضعية جيدة، استمر في التمرين');
  }

  // State machine for rep counting (only proceed if not in INCORRECT_FORM)
  if (state.repState !== RepState.INCORRECT_FORM) {
      switch (state.repState) {
        case RepState.STARTING:
        case RepState.UP:
          // Transition to DOWN when knees bend and hips lower
          if (kneeAngle < settings.thresholds.downAngle + 10) { // تحسين: زيادة التسامح في زاوية الركبة
            state.repState = RepState.DOWN;
            if (state.formCorrect) {
              state.formFeedback.push('نزول جيد، استمر');
            }
          }
          break;

        case RepState.DOWN:
          // Transition to UP when knees extend and hips rise
          if (kneeAngle > settings.thresholds.upAngle - 10) { // تحسين: زيادة التسامح في زاوية الركبة
            state.repState = RepState.UP;
            state.repCount += 1;
            state.totalReps += 1;
            if (state.formCorrect) {
              state.correctFormCount += 1;
              state.formFeedback.push('تكرار ممتاز!');
            }
            state.lastRepTimestamp = Date.now();

            // Check if set is complete
            if (state.repCount >= settings.targetReps) {
              state.setCount += 1;
              state.repCount = 0;
              state.repState = RepState.RESTING;

              if (state.setCount > settings.sets) {
                state.setCount = settings.sets;
                state.formFeedback.push('اكتمل التمرين! عمل رائع!');
              } else {
                state.formFeedback.push(`اكتملت المجموعة ${state.setCount}! استرح لمدة ${settings.restBetweenSets} ثوانٍ.`);
              }
            }
          }
          break;

        case RepState.RESTING: {
          // Check if rest period is over
          const restTime = (Date.now() - state.lastRepTimestamp) / 1000;
          if (restTime >= settings.restBetweenSets) {
            state.repState = RepState.STARTING;
            state.formFeedback.push(`بدء المجموعة ${state.setCount}`);
          } else {
            state.formFeedback.push(`استراحة: ${Math.round(settings.restBetweenSets - restTime)} ثانية متبقية`);
          }
          break;
        }
      }
  }

  return state;
}

// Process bicep curl exercise
function processBicepCurl(
  state: ExerciseState,
  pose: Pose,
  settings: ExerciseSettings
): ExerciseState {
  // Focus on primary landmarks for bicep curls
  const leftShoulder = getKeypoint(pose, 'left_shoulder');
  const leftElbow = getKeypoint(pose, 'left_elbow');
  const leftWrist = getKeypoint(pose, 'left_wrist');
  const leftHip = getKeypoint(pose, 'left_hip');
  const rightShoulder = getKeypoint(pose, 'right_shoulder');
  const rightElbow = getKeypoint(pose, 'right_elbow');
  const rightWrist = getKeypoint(pose, 'right_wrist');
  const rightHip = getKeypoint(pose, 'right_hip');

  if (!leftShoulder || !leftElbow || !leftWrist || !leftHip || !rightShoulder || !rightElbow || !rightWrist || !rightHip) {
    state.formFeedback.push('Cannot detect arms and torso clearly');
    state.formCorrect = false;
    return state;
  }

  // Calculate key angles and measurements (average)
  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
  const elbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

  // Calculate back angle relative to vertical (average)
  const leftBackAngleVertical = calculateAngle(leftShoulder, leftHip, { x: leftHip.x, y: leftHip.y + 100 });
  const rightBackAngleVertical = calculateAngle(rightShoulder, rightHip, { x: rightHip.x, y: rightHip.y + 100 });
  const backAngleDeviation = ( (180 - leftBackAngleVertical) + (180 - rightBackAngleVertical) ) / 2; // Deviation from straight up

  // Calculate upper arm movement (deviation from vertical)
  const leftUpperArmAngleVertical = calculateAngle(leftElbow, leftShoulder, { x: leftShoulder.x, y: leftShoulder.y + 100 });
  const rightUpperArmAngleVertical = calculateAngle(rightElbow, rightShoulder, { x: rightShoulder.x, y: rightShoulder.y + 100 });
  const upperArmDeviation = ( (180 - leftUpperArmAngleVertical) + (180 - rightUpperArmAngleVertical) ) / 2;

  // Log detailed analytics for debugging
  // console.log(`Bicep Curl - Avg Elbow Angle: ${elbowAngle.toFixed(1)}°, Avg Back Dev: ${backAngleDeviation.toFixed(1)}°, Avg Upper Arm Dev: ${upperArmDeviation.toFixed(1)}°`);

  // Reset form correctness for this frame
  state.formCorrect = true;
  state.formFeedback = [];
  state.formIssues = {}; // Clear previous issues

  // Check back angle deviation
  if (backAngleDeviation > (settings.thresholds.backAngleMax || 20)) {
    state.formFeedback.push(`Keep your back straight. Angle: ${backAngleDeviation.toFixed(0)}° (Max: ${settings.thresholds.backAngleMax || 20}°)`);
    state.formCorrect = false;
    state.formIssues['left_hip'] = true;
    state.formIssues['right_hip'] = true;
  }

  // Check for excessive upper arm movement (deviation from vertical)
  if (upperArmDeviation > (settings.thresholds.upperArmMovementMax || 25)) {
    state.formFeedback.push(`Keep upper arms still. Movement: ${upperArmDeviation.toFixed(0)}° (Max: ${settings.thresholds.upperArmMovementMax || 25}°)`);
    state.formCorrect = false;
    state.formIssues['left_shoulder'] = true;
    state.formIssues['right_shoulder'] = true;
    state.formIssues['left_elbow'] = true;
    state.formIssues['right_elbow'] = true;
  }

  // If form is incorrect and we're not in INCORRECT_FORM state, transition to it
  if (!state.formCorrect && state.repState !== RepState.INCORRECT_FORM &&
      state.repState !== RepState.RESTING && state.repState !== RepState.STARTING) {
    state.repState = RepState.INCORRECT_FORM;
    state.formFeedback.push('Fix your form to continue counting reps');
    return state;
  }

  // If form was incorrect but is now fixed, return to appropriate state
  if (state.formCorrect && state.repState === RepState.INCORRECT_FORM) {
    // Determine if we should go back to UP or DOWN state based on elbow angle
    state.repState = elbowAngle < settings.thresholds.upAngle ? RepState.UP : RepState.DOWN;
    state.formFeedback.push('Good form, continue your exercise');
  }

  // State machine for rep counting (only proceed if not in INCORRECT_FORM)
  if (state.repState !== RepState.INCORRECT_FORM) {
      switch (state.repState) {
        case RepState.STARTING:
        case RepState.DOWN:
          if (elbowAngle < settings.thresholds.upAngle) {
            state.repState = RepState.UP;
          }
          break;

        case RepState.UP:
          if (elbowAngle > settings.thresholds.downAngle) {
            state.repState = RepState.DOWN;
            state.repCount += 1;
            state.totalReps += 1; // Increment total reps
            if (state.formCorrect) {
              state.correctFormCount += 1; // Increment correct form count
            }
            state.lastRepTimestamp = Date.now();

            // Check if set is complete
            if (state.repCount >= settings.targetReps) {
              state.setCount += 1;
              state.repCount = 0;
              state.repState = RepState.RESTING;

              if (state.setCount > settings.sets) {
                state.setCount = settings.sets;
                state.formFeedback.push('Workout complete! Great job!');
              } else {
                state.formFeedback.push(`Set ${state.setCount - 1} complete! Rest for ${settings.restBetweenSets} seconds.`);
              }
            }
          }
          break;

        case RepState.RESTING: {
          // Check if rest period is over
          const restTime = (Date.now() - state.lastRepTimestamp) / 1000;
          if (restTime >= settings.restBetweenSets) {
            state.repState = RepState.STARTING;
            state.formFeedback.push(`Starting set ${state.setCount}`);
          } else {
            state.formFeedback.push(`Rest: ${Math.round(settings.restBetweenSets - restTime)}s remaining`);
          }
          break;
        }

        // case RepState.INCORRECT_FORM: // Handled above
        //   break;
      }
  }

  return state;
}

// Process push up exercise
function processPushUp(
  state: ExerciseState,
  pose: Pose,
  settings: ExerciseSettings
): ExerciseState {
  // Get landmarks for both sides
  const leftShoulder = getKeypoint(pose, 'left_shoulder');
  const leftElbow = getKeypoint(pose, 'left_elbow');
  const leftWrist = getKeypoint(pose, 'left_wrist');
  const leftHip = getKeypoint(pose, 'left_hip');
  const leftKnee = getKeypoint(pose, 'left_knee');
  const rightShoulder = getKeypoint(pose, 'right_shoulder');
  const rightElbow = getKeypoint(pose, 'right_elbow');
  const rightWrist = getKeypoint(pose, 'right_wrist');
  const rightHip = getKeypoint(pose, 'right_hip');
  const rightKnee = getKeypoint(pose, 'right_knee');
  const nose = getKeypoint(pose, 'nose');

  // Check visibility
  const leftVisible = leftShoulder && leftElbow && leftWrist && leftHip && leftKnee;
  const rightVisible = rightShoulder && rightElbow && rightWrist && rightHip && rightKnee;

  if (!leftVisible && !rightVisible) {
    state.formFeedback.push('Cannot detect arms, torso, and legs clearly');
    state.formCorrect = false;
    return state;
  }

  // Initialize consecutive errors tracking if not present
  if (!state.consecutiveErrors) {
    state.consecutiveErrors = {};
  }

  // Calculate key angles and measurements using available side(s)
  let elbowAngle = 0;
  let bodyLineAngle = 0;
  let shoulderAngle = 0;
  let headAngle = 0;
  let visibleSides = 0;

  // Calculate arm length (for chest drop percentage)
  let armLength = 0;

  if (leftVisible) {
    elbowAngle += calculateAngle(leftShoulder!, leftElbow!, leftWrist!);
    bodyLineAngle += calculateAngle(leftShoulder!, leftHip!, leftKnee!); // Angle for body straightness
    shoulderAngle += calculateAngle(leftElbow!, leftShoulder!, leftHip!); // Shoulder angle (upper arm to torso)
    armLength += Math.sqrt(
      Math.pow(leftShoulder!.x - leftElbow!.x, 2) + 
      Math.pow(leftShoulder!.y - leftElbow!.y, 2)
    );
    visibleSides++;
  }
  
  if (rightVisible) {
    elbowAngle += calculateAngle(rightShoulder!, rightElbow!, rightWrist!);
    bodyLineAngle += calculateAngle(rightShoulder!, rightHip!, rightKnee!);
    shoulderAngle += calculateAngle(rightElbow!, rightShoulder!, rightHip!);
    armLength += Math.sqrt(
      Math.pow(rightShoulder!.x - rightElbow!.x, 2) + 
      Math.pow(rightShoulder!.y - rightElbow!.y, 2)
    );
    visibleSides++;
  }

  // Average the values if both sides are visible
  if (visibleSides > 0) {
    elbowAngle /= visibleSides;
    bodyLineAngle /= visibleSides;
    shoulderAngle /= visibleSides;
    armLength /= visibleSides;
  }

  // Calculate head angle if nose is visible
  if (nose && leftVisible) {
    headAngle = calculateAngle(leftHip!, leftShoulder!, nose);
  } else if (nose && rightVisible) {
    headAngle = calculateAngle(rightHip!, rightShoulder!, nose);
  }

  // Calculate chest height (average of shoulders)
  const chestHeight = (leftVisible ? leftShoulder!.y : 0) + (rightVisible ? rightShoulder!.y : 0) / visibleSides;
  
  // Store starting chest height if not already set
  if (!state.startingChestHeight && state.repState === RepState.STARTING) {
    state.startingChestHeight = chestHeight;
  }
  
  // Calculate chest drop percentage
  const chestDropPercentage = state.startingChestHeight ? 
    (state.startingChestHeight - chestHeight) / armLength : 0;

  // Check hand position (distance from shoulders)
  let handsUnderShoulders = true;
  const bodyWidth = leftVisible && rightVisible ? 
    Math.abs(leftShoulder!.x - rightShoulder!.x) : 0;
  
  if (leftVisible && bodyWidth > 0) {
    const leftHandOffset = Math.abs(leftWrist!.x - leftShoulder!.x) / bodyWidth;
    if (leftHandOffset > settings.thresholds.handPositionThreshold) {
      handsUnderShoulders = false;
    }
  }
  
  if (rightVisible && bodyWidth > 0) {
    const rightHandOffset = Math.abs(rightWrist!.x - rightShoulder!.x) / bodyWidth;
    if (rightHandOffset > settings.thresholds.handPositionThreshold) {
      handsUnderShoulders = false;
    }
  }

  // Reset form correctness for this frame
  state.formCorrect = true;
  state.formFeedback = [];
  state.formIssues = {}; // Clear previous issues

  // Determine if this is a valid rep attempt (for error flagging)
  const isValidDownAttempt = state.repState === RepState.DOWN && 
                           elbowAngle <= settings.thresholds.maxElbowAngleDown && 
                           chestDropPercentage >= settings.thresholds.minChestDropPercentage;
                           
  const isValidUpAttempt = state.repState === RepState.UP && 
                         elbowAngle >= settings.thresholds.minElbowAngleUp;

  const isValidRepAttempt = isValidDownAttempt || isValidUpAttempt;

  // Check body line straightness (torso angle)
  if (isValidRepAttempt && (bodyLineAngle < 175 || bodyLineAngle > 185)) {
    // Determine if sagging or piking
    const errorType = bodyLineAngle < 175 ? 'sagging' : 'piking';
    
    // Increment consecutive error count
    state.consecutiveErrors[errorType] = (state.consecutiveErrors[errorType] || 0) + 1;
    
    // Only flag as error if it's been consistent
    if (state.consecutiveErrors[errorType] >= settings.thresholds.consecutiveErrorThreshold) {
      if (errorType === 'sagging') {
        state.formFeedback.push('Lift hips, keep straight.');
      } else {
        state.formFeedback.push('Lower hips, align body.');
      }
      state.formCorrect = false;
      state.formIssues['left_hip'] = leftVisible;
      state.formIssues['right_hip'] = rightVisible;
    }
  } else {
    // Reset consecutive error counts for body line
    state.consecutiveErrors['sagging'] = 0;
    state.consecutiveErrors['piking'] = 0;
  }

  // Check elbow angle in DOWN phase
  if (isValidDownAttempt && elbowAngle > settings.thresholds.maxElbowAngleDown) {
    state.consecutiveErrors['shallow'] = (state.consecutiveErrors['shallow'] || 0) + 1;
    
    if (state.consecutiveErrors['shallow'] >= settings.thresholds.consecutiveErrorThreshold) {
      state.formFeedback.push('Lower chest, elbows to 90°.');
      state.formCorrect = false;
      state.formIssues['left_elbow'] = leftVisible;
      state.formIssues['right_elbow'] = rightVisible;
    }
  } else {
    state.consecutiveErrors['shallow'] = 0;
  }

  // Check head/neck position
  if (isValidRepAttempt && nose && Math.abs(headAngle - 180) > settings.thresholds.headAngleMax) {
    state.consecutiveErrors['head'] = (state.consecutiveErrors['head'] || 0) + 1;
    
    if (state.consecutiveErrors['head'] >= settings.thresholds.consecutiveErrorThreshold) {
      state.formFeedback.push('Look forward, keep neutral.');
      state.formCorrect = false;
      state.formIssues['nose'] = true;
    }
  } else {
    state.consecutiveErrors['head'] = 0;
  }

  // Check elbow flare (shoulder angle) in DOWN phase
  if (isValidDownAttempt && shoulderAngle > settings.thresholds.elbowAngleOutMax) {
    state.consecutiveErrors['elbowFlare'] = (state.consecutiveErrors['elbowFlare'] || 0) + 1;
    
    if (state.consecutiveErrors['elbowFlare'] >= settings.thresholds.consecutiveErrorThreshold) {
      state.formFeedback.push('Tuck elbows, aim for 45°.');
      state.formCorrect = false;
      state.formIssues['left_elbow'] = leftVisible;
      state.formIssues['right_elbow'] = rightVisible;
    }
  } else {
    state.consecutiveErrors['elbowFlare'] = 0;
  }

  // Check elbow extension in UP phase
  if (isValidUpAttempt && elbowAngle < settings.thresholds.minElbowAngleUp) {
    state.consecutiveErrors['extension'] = (state.consecutiveErrors['extension'] || 0) + 1;
    
    if (state.consecutiveErrors['extension'] >= settings.thresholds.consecutiveErrorThreshold) {
      state.formFeedback.push('Straighten arms.');
      state.formCorrect = false;
      state.formIssues['left_elbow'] = leftVisible;
      state.formIssues['right_elbow'] = rightVisible;
    }
  } else {
    state.consecutiveErrors['extension'] = 0;
  }

  // If form is incorrect and we're not in INCORRECT_FORM state, transition to it
  if (!state.formCorrect && state.repState !== RepState.INCORRECT_FORM &&
      state.repState !== RepState.RESTING && state.repState !== RepState.STARTING) {
    state.repState = RepState.INCORRECT_FORM;
    state.formFeedback.push('Fix your form to continue counting reps');
    return state;
  }

  // If form was incorrect but is now fixed, return to appropriate state
  if (state.formCorrect && state.repState === RepState.INCORRECT_FORM) {
    // Determine if we should go back to UP or DOWN state based on elbow angle
    state.repState = elbowAngle < settings.thresholds.downAngle ? RepState.DOWN : RepState.UP;
    state.formFeedback.push('Good form, continue your exercise');
  }

  // State machine for rep counting (only proceed if not in INCORRECT_FORM)
  if (state.repState !== RepState.INCORRECT_FORM) {
      switch (state.repState) {
        case RepState.STARTING:
        case RepState.UP:
          // Transition to DOWN when elbows bend and chest lowers
          if (elbowAngle < settings.thresholds.downAngle && 
              chestDropPercentage >= settings.thresholds.minChestDropPercentage) {
            state.repState = RepState.DOWN;
            if (state.formCorrect) {
              state.formFeedback.push('Good descent, keep going');
            }
          }
          break;

        case RepState.DOWN:
          // Transition to UP when elbows extend and chest rises
          if (elbowAngle > settings.thresholds.upAngle) {
            state.repState = RepState.UP;
            state.repCount += 1;
            state.totalReps += 1;
            if (state.formCorrect) {
              state.correctFormCount += 1;
              state.formFeedback.push('Nice rep!');
            }
            state.lastRepTimestamp = Date.now();

            // Check if set is complete
            if (state.repCount >= settings.targetReps) {
              state.setCount += 1;
              state.repCount = 0;
              state.repState = RepState.RESTING;

              if (state.setCount > settings.sets) {
                state.setCount = settings.sets;
                state.formFeedback.push('Workout complete! Great job!');
              } else {
                state.formFeedback.push(`Set ${state.setCount} complete! Rest for ${settings.restBetweenSets} seconds.`);
              }
            }
          }
          break;

        case RepState.RESTING: {
          // Check if rest period is over
          const restTime = (Date.now() - state.lastRepTimestamp) / 1000;
          if (restTime >= settings.restBetweenSets) {
            state.repState = RepState.STARTING;
            state.formFeedback.push(`Starting set ${state.setCount}`);
          } else {
            state.formFeedback.push(`Rest: ${Math.round(settings.restBetweenSets - restTime)}s remaining`);
          }
          break;
        }
      }
  }

  return state;
}

// Process pull up exercise
function processPullUp(
  state: ExerciseState,
  pose: Pose,
  settings: ExerciseSettings
): ExerciseState {
  // Get landmarks for both sides and nose
  const leftShoulder = getKeypoint(pose, 'left_shoulder');
  const leftElbow = getKeypoint(pose, 'left_elbow');
  const leftWrist = getKeypoint(pose, 'left_wrist');
  const rightShoulder = getKeypoint(pose, 'right_shoulder');
  const rightElbow = getKeypoint(pose, 'right_elbow');
  const rightWrist = getKeypoint(pose, 'right_wrist');
  const nose = getKeypoint(pose, 'nose');

  if (!leftShoulder || !leftElbow || !leftWrist || !rightShoulder || !rightElbow || !rightWrist || !nose) {
    state.formFeedback.push('Cannot detect arms and head clearly');
    state.formCorrect = false;
    return state;
  }

  // Calculate average elbow angle
  const leftElbowAngle = calculateAngle(leftShoulder, leftElbow, leftWrist);
  const rightElbowAngle = calculateAngle(rightShoulder, rightElbow, rightWrist);
  const elbowAngle = (leftElbowAngle + rightElbowAngle) / 2;

  // Calculate average wrist Y position
  const avgWristY = (leftWrist.y + rightWrist.y) / 2;

  // Form Checks
  state.formCorrect = true;
  state.formIssues = {};

  // Check chin position relative to average wrist height in the 'DOWN' state (top of pull-up)
  const chinAboveWrist = nose.y < avgWristY; // Lower Y value means higher on screen
  if (settings.thresholds.chinAboveWristRequired && state.repState === RepState.DOWN && !chinAboveWrist) {
      state.formFeedback.push('Pull higher - Chin needs to clear the bar (hands)');
      state.formCorrect = false;
      state.formIssues['nose'] = true;
      state.formIssues['left_wrist'] = true;
      state.formIssues['right_wrist'] = true;
  }

  // If form is incorrect, transition to INCORRECT_FORM state
  if (!state.formCorrect && state.repState !== RepState.INCORRECT_FORM &&
      state.repState !== RepState.RESTING && state.repState !== RepState.STARTING) {
    state.repState = RepState.INCORRECT_FORM;
    state.formFeedback.push('Fix your form to continue counting reps');
    return state;
  }

  // If form was incorrect but is now fixed, return to appropriate state
  if (state.formCorrect && state.repState === RepState.INCORRECT_FORM) {
    // If chin is now above wrist (or check not required) and angle is appropriate for DOWN state
    if ((chinAboveWrist || !settings.thresholds.chinAboveWristRequired) && elbowAngle < settings.thresholds.downAngle) {
        state.repState = RepState.DOWN;
    } else {
        state.repState = RepState.UP; // Otherwise assume UP state (extended)
    }
    state.formFeedback.push('Good form, continue your exercise');
  }

  // State machine for rep counting (Count on DOWN_TO_UP transition)
  // Note: UP state = arms extended (angle > upAngle threshold)
  //       DOWN state = arms contracted (angle < downAngle threshold)
  switch (state.repState) {
    case RepState.STARTING:
    case RepState.UP: // Arms extended (bottom)
      if (elbowAngle < settings.thresholds.downAngle) { // Start pulling up
          // Check chin position upon entering DOWN state if required
          if (settings.thresholds.chinAboveWristRequired && !(nose.y < avgWristY)) {
              state.formFeedback.push('Pull higher - Chin needs to clear the bar (hands)');
              state.formCorrect = false;
              state.formIssues['nose'] = true;
              state.formIssues['left_wrist'] = true;
              state.formIssues['right_wrist'] = true;
              state.repState = RepState.INCORRECT_FORM;
          } else {
              state.repState = RepState.DOWN;
          }
      }
      break;

    case RepState.DOWN: // Arms contracted (top)
      if (elbowAngle > settings.thresholds.upAngle) { // Start lowering, complete rep
        state.repState = RepState.UP;
        state.repCount += 1;
        state.totalReps += 1;
        if (state.formCorrect) {
          state.correctFormCount += 1;
        }
        state.lastRepTimestamp = Date.now();

        // Check if set is complete
        if (state.repCount >= settings.targetReps) {
          state.setCount += 1;
          state.repCount = 0;
          state.repState = RepState.RESTING;
          if (state.setCount > settings.sets) {
            state.setCount = settings.sets;
            state.formFeedback.push('Workout complete! Great job!');
          } else {
            state.formFeedback.push(`Set ${state.setCount - 1} complete! Rest for ${settings.restBetweenSets} seconds.`);
          }
        }
      }
      break;

    case RepState.RESTING: {
      const restTime = (Date.now() - state.lastRepTimestamp) / 1000;
      if (restTime >= settings.restBetweenSets) {
        state.repState = RepState.STARTING;
        state.formFeedback.push(`Starting set ${state.setCount}`);
      } else {
        state.formFeedback.push(`Rest: ${Math.round(settings.restBetweenSets - restTime)}s remaining`);
      }
      break;
    }

    case RepState.INCORRECT_FORM:
      // Already handled above
      break;
  }

  return state;
}

// Process forward lunge exercise
function processForwardLunge(
  state: ExerciseState,
  pose: Pose,
  settings: ExerciseSettings
): ExerciseState {
  // Get primary landmarks for lunges
  const leftHip = getKeypoint(pose, 'left_hip');
  const leftKnee = getKeypoint(pose, 'left_knee');
  const leftAnkle = getKeypoint(pose, 'left_ankle');
  const leftShoulder = getKeypoint(pose, 'left_shoulder');
  const rightHip = getKeypoint(pose, 'right_hip');
  const rightKnee = getKeypoint(pose, 'right_knee');
  const rightAnkle = getKeypoint(pose, 'right_ankle');
  const rightShoulder = getKeypoint(pose, 'right_shoulder');

  if (!leftHip || !leftKnee || !leftAnkle || !leftShoulder || !rightHip || !rightKnee || !rightAnkle || !rightShoulder) {
    state.formFeedback.push('لا يمكن اكتشاف الساقين والجذع بوضوح');
    state.formCorrect = false;
    return state;
  }

  // تحسين تحديد الساق الأمامية بناءً على موضع الركبة والكاحل
  // الساق الأمامية عادة ما تكون ركبتها أقرب للأرض وكاحلها أبعد للأمام
  const leftKneeForwardness = leftKnee.y - leftAnkle.y;
  const rightKneeForwardness = rightKnee.y - rightAnkle.y;
  const isLeftLegForward = leftKneeForwardness > rightKneeForwardness;
  
  // Get front and back leg landmarks
  const frontHip = isLeftLegForward ? leftHip : rightHip;
  const frontKnee = isLeftLegForward ? leftKnee : rightKnee;
  const frontAnkle = isLeftLegForward ? leftAnkle : rightAnkle;
  const backHip = isLeftLegForward ? rightHip : leftHip;
  const backKnee = isLeftLegForward ? rightKnee : leftKnee;
  const backAnkle = isLeftLegForward ? rightAnkle : leftAnkle;

  // Calculate key angles
  const frontKneeAngle = calculateAngle(frontHip, frontKnee, frontAnkle);
  const backKneeAngle = calculateAngle(backHip, backKnee, backAnkle);
  
  // Calculate torso angle relative to vertical
  const leftTorsoAngle = calculateAngle(leftShoulder, leftHip, { x: leftHip.x, y: leftHip.y + 100 });
  const rightTorsoAngle = calculateAngle(rightShoulder, rightHip, { x: rightHip.x, y: rightHip.y + 100 });
  const torsoAngleDeviation = ((180 - leftTorsoAngle) + (180 - rightTorsoAngle)) / 2;

  // Check if front knee extends beyond toes
  const kneeOverToes = frontKnee.x > frontAnkle.x + (Math.abs(frontHip.x - frontAnkle.x) * settings.thresholds.kneePositionThreshold);

  // Reset form correctness for this frame
  state.formCorrect = true;
  state.formFeedback = [];
  state.formIssues = {}; // Clear previous issues

  // Initialize consecutive errors tracking if not present
  if (!state.consecutiveErrors) {
    state.consecutiveErrors = {};
  }

  // Calculate hip drop percentage (compared to standing height)
  const hipHeight = (leftHip.y + rightHip.y) / 2;
  const legLength = Math.abs(frontHip.y - frontAnkle.y);
  const hipDropPercentage = (state.startingHipHeight ? (state.startingHipHeight - hipHeight) / legLength : 0);
  
  // Store starting hip height if not already set
  if (!state.startingHipHeight && state.repState === RepState.STARTING) {
    state.startingHipHeight = hipHeight;
  }
  
  // Check shoulder level
  const shoulderHeightDiff = Math.abs(leftShoulder.y - rightShoulder.y);
  const bodyHeight = Math.abs(((leftShoulder.y + rightShoulder.y) / 2) - ((leftAnkle.y + rightAnkle.y) / 2));
  const shoulderLevelPercentage = shoulderHeightDiff / bodyHeight;

  // Determine if this is a valid rep attempt (for error flagging)
  const isValidDownAttempt = state.repState === RepState.DOWN && 
                           frontKneeAngle <= settings.thresholds.downAngle + 15 && 
                           hipDropPercentage >= settings.thresholds.minHipDropPercentage;
                           
  const isValidUpAttempt = state.repState === RepState.UP && 
                         frontKneeAngle >= settings.thresholds.upAngle - 10;

  const isValidRepAttempt = isValidDownAttempt || isValidUpAttempt;

  // Check front knee angle (should be around 90 degrees in DOWN position)
  const frontKneeAngleCorrect = frontKneeAngle >= settings.thresholds.downAngle - 15 && 
                               frontKneeAngle <= settings.thresholds.downAngle + 15;
  
  if (isValidDownAttempt && !frontKneeAngleCorrect) {
    state.consecutiveErrors['frontKnee'] = (state.consecutiveErrors['frontKnee'] || 0) + 1;
    
    if (state.consecutiveErrors['frontKnee'] >= 3) {
      if (frontKneeAngle > settings.thresholds.downAngle + 15) {
        state.formFeedback.push('ثني الركبة الأمامية أكثر، استهدف 90°');
      } else {
        state.formFeedback.push('الركبة الأمامية منثنية كثيرًا، استهدف 90°');
      }
      state.formCorrect = false;
      state.formIssues[isLeftLegForward ? 'left_knee' : 'right_knee'] = true;
    }
  } else {
    state.consecutiveErrors['frontKnee'] = 0;
  }

  // Check back knee angle (should be in the bodyLineAngleRange)
  const [minBackAngle, maxBackAngle] = settings.thresholds.bodyLineAngleRange || [80, 100];
  if (isValidDownAttempt && (backKneeAngle < minBackAngle || backKneeAngle > maxBackAngle)) {
    state.consecutiveErrors['backKnee'] = (state.consecutiveErrors['backKnee'] || 0) + 1;
    
    if (state.consecutiveErrors['backKnee'] >= 3) {
      state.formFeedback.push('اضبط زاوية الركبة الخلفية، يجب أن تكون قريبة من الأرض');
      state.formCorrect = false;
      state.formIssues[isLeftLegForward ? 'right_knee' : 'left_knee'] = true;
    }
  } else {
    state.consecutiveErrors['backKnee'] = 0;
  }

  // Check torso angle (should be upright, minimal forward lean)
  if (isValidRepAttempt && torsoAngleDeviation > settings.thresholds.backAngleMax) {
    state.consecutiveErrors['torso'] = (state.consecutiveErrors['torso'] || 0) + 1;
    
    if (state.consecutiveErrors['torso'] >= 3) {
      state.formFeedback.push('حافظ على استقامة الجذع، قلل الميل للأمام');
      state.formCorrect = false;
      state.formIssues['left_hip'] = true;
      state.formIssues['right_hip'] = true;
      state.formIssues['left_shoulder'] = true;
      state.formIssues['right_shoulder'] = true;
    }
  } else {
    state.consecutiveErrors['torso'] = 0;
  }

  // Check knee over toes (front knee shouldn't extend too far beyond toes)
  if (isValidDownAttempt && kneeOverToes) {
    state.consecutiveErrors['kneeOverToes'] = (state.consecutiveErrors['kneeOverToes'] || 0) + 1;
    
    if (state.consecutiveErrors['kneeOverToes'] >= 3) {
      state.formFeedback.push('الركبة الأمامية متقدمة كثيرًا، حاذِ فوق الكاحل');
      state.formCorrect = false;
      state.formIssues[isLeftLegForward ? 'left_knee' : 'right_knee'] = true;
    }
  } else {
    state.consecutiveErrors['kneeOverToes'] = 0;
  }
  
  // Check for insufficient depth
  if (isValidDownAttempt && 
      frontKneeAngle > settings.thresholds.minDepthAngle && 
      hipDropPercentage < settings.thresholds.minHipDropPercentage) {
    state.consecutiveErrors['depth'] = (state.consecutiveErrors['depth'] || 0) + 1;
    
    if (state.consecutiveErrors['depth'] >= 3) {
      state.formFeedback.push('انزل أعمق، اخفض وركيك');
      state.formCorrect = false;
      state.formIssues[isLeftLegForward ? 'left_knee' : 'right_knee'] = true;
    }
  } else {
    state.consecutiveErrors['depth'] = 0;
  }
  
  // Check for uneven shoulders
  if (isValidRepAttempt && shoulderLevelPercentage > settings.thresholds.shoulderLevelThreshold) {
    state.consecutiveErrors['shoulders'] = (state.consecutiveErrors['shoulders'] || 0) + 1;
    
    if (state.consecutiveErrors['shoulders'] >= 3) {
      state.formFeedback.push('اجعل كتفيك متوازيين، حافظ على مستواهما');
      state.formCorrect = false;
      state.formIssues['left_shoulder'] = true;
      state.formIssues['right_shoulder'] = true;
    }
  } else {
    state.consecutiveErrors['shoulders'] = 0;
  }

  // If form is incorrect and we're not in INCORRECT_FORM state, transition to it
  if (!state.formCorrect && state.repState !== RepState.INCORRECT_FORM &&
      state.repState !== RepState.RESTING && state.repState !== RepState.STARTING) {
    state.repState = RepState.INCORRECT_FORM;
    state.formFeedback.push('صحح وضعيتك لاستمرار عد التكرارات');
    return state;
  }

  // If form was incorrect but is now fixed, return to appropriate state
  if (state.formCorrect && state.repState === RepState.INCORRECT_FORM) {
    // Determine if we should go back to UP or DOWN state based on front knee angle
    state.repState = frontKneeAngle < settings.thresholds.downAngle ? RepState.DOWN : RepState.UP;
    state.formFeedback.push('وضعية جيدة، استمر في التمرين');
  }

  // State machine for rep counting (only proceed if not in INCORRECT_FORM)
  if (state.repState !== RepState.INCORRECT_FORM) {
      switch (state.repState) {
        case RepState.STARTING:
        case RepState.UP:
          if (frontKneeAngle < settings.thresholds.downAngle) {
            state.repState = RepState.DOWN;
            if (state.formCorrect) {
              state.formFeedback.push('نزول جيد، استمر');
            }
          }
          break;

        case RepState.DOWN:
          if (frontKneeAngle > settings.thresholds.upAngle) {
            state.repState = RepState.UP;
            state.repCount += 1;
            state.totalReps += 1;
            if (state.formCorrect) {
              state.correctFormCount += 1;
              state.formFeedback.push('تكرار ممتاز!');
            }
            state.lastRepTimestamp = Date.now();

            // Check if set is complete
            if (state.repCount >= settings.targetReps) {
              state.setCount += 1;
              state.repCount = 0;
              state.repState = RepState.RESTING;

              if (state.setCount > settings.sets) {
                state.setCount = settings.sets;
                state.formFeedback.push('اكتمل التمرين! عمل رائع!');
              } else {
                state.formFeedback.push(`اكتملت المجموعة ${state.setCount}! استرح لمدة ${settings.restBetweenSets} ثوانٍ.`);
              }
            }
          }
          break;

        case RepState.RESTING: {
          // Check if rest period is over
          const restTime = (Date.now() - state.lastRepTimestamp) / 1000;
          if (restTime >= settings.restBetweenSets) {
            state.repState = RepState.STARTING;
            state.formFeedback.push(`بدء المجموعة ${state.setCount}`);
          } else {
            state.formFeedback.push(`استراحة: ${Math.round(settings.restBetweenSets - restTime)} ثانية متبقية`);
          }
          break;
        }
      }
  }

  return state;
}
