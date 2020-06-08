import { getTaskInterpreter, logger } from './interpreters';
import { flow } from 'fp-ts/lib/function';
import { exampleProgram1, exampleProgram2, exampleProgram3 } from './examples';
import { foldFree } from 'fp-ts-contrib/lib/Free';
import { task } from 'fp-ts/lib/Task';
import { john, coolPost } from '../../domain';


(async () => {
  const taskI = getTaskInterpreter();
  const interpreter = flow(logger, taskI);

  console.log('exampleProgram1: first run');
  await foldFree(task)(interpreter, exampleProgram1(john.id))();
  console.log('exampleProgram1: second run');
  await foldFree(task)(interpreter, exampleProgram1(john.id))();
  console.log('exampleProgram2');
  await foldFree(task)(interpreter, exampleProgram2(coolPost))();
  console.log('exampleProgram3');
  await foldFree(task)(interpreter, exampleProgram3(1, coolPost))();
})();
