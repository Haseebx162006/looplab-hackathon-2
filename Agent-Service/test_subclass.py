import sys
try:
    from crewai import LLM
    from pydantic import PrivateAttr
    
    class FallbackLLM(LLM):
        _models_list: list = PrivateAttr(default_factory=list)
        _current_model_idx: int = PrivateAttr(default=0)

        def __init__(self, models: list, **kwargs):
            super().__init__(model=models[0], **kwargs)
            self._models_list = models
            self._current_model_idx = 0
            
    # Test instantiating
    llm = FallbackLLM(models=["groq/openai/gpt-oss-120b", "groq/openai/gpt-oss-20b"], api_key="test")
    print("SUCCESS: Instantiated successfully!")
    print("Model:", llm.model)
    print("Models List:", llm._models_list)
except Exception as e:
    print("ERROR:", e)
    sys.exit(1)
