class Validator {
  // Validate if trainee can access a module
  validateModuleAccess(module, progress) {
    const prerequisites = module.prerequisites || [];
    
    for (const prereqId of prerequisites) {
      if (!progress.completedModules.includes(prereqId)) {
        return {
          valid: false,
          message: `Prerequisite module not completed: ${prereqId}`,
        };
      }
    }

    return { valid: true };
  }

  // Validate step completion
  validateStepCompletion(step, stepData) {
    if (step.requiresConfirmation && !stepData.confirmed) {
      return {
        valid: false,
        message: 'Step requires confirmation before proceeding',
      };
    }

    if (step.requiresVideoCompletion && !stepData.videoCompleted) {
      return {
        valid: false,
        message: 'Video must be watched before proceeding',
      };
    }

    // Validate safety warnings acknowledged
    if (step.safetyWarnings && step.safetyWarnings.length > 0) {
      if (!stepData.safetyAcknowledged) {
        return {
          valid: false,
          message: 'Safety warnings must be acknowledged',
        };
      }
    }

    return { valid: true };
  }

  // Validate knowledge check answer
  validateKnowledgeCheck(check, answer) {
    if (check.type === 'multiple-choice') {
      return check.correctAnswer === answer;
    }
    return false;
  }

  // Validate if all module steps are completed
  validateModuleCompletion(module, moduleProgress) {
    const totalSteps = module.steps.length;
    const completedSteps = moduleProgress.completedSteps?.length || 0;

    if (completedSteps < totalSteps) {
      return {
        valid: false,
        message: `Not all steps completed. ${completedSteps}/${totalSteps} completed`,
      };
    }

    return { valid: true };
  }

  // Validate knowledge check score
  validateKnowledgeCheckScore(score, passingScore = 80) {
    return score >= passingScore;
  }
}

export default new Validator();
