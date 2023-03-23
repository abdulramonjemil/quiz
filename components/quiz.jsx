import Component, { createInstanceRefHolder } from "../core/component"
import Styles from "../scss/quiz.module.scss"
import Header from "./header"
import { uniqueId } from "../core/library"
import Progress from "./progress"
// import Question from "./question"
import ControlPanel from "./control-panel"
import Result from "./result"
// import CodeBoard from "./code-board"

export default class Quiz extends Component {
  static create(container) {
    container.replaceChildren(<Quiz headerContent="Your opinion matters" />)
  }

  /* eslint-disable-next-line class-methods-use-this */
  $render() {
    const { headerContent } = this.$props
    const quizLabellingId = uniqueId()
    const progressRefHolder = createInstanceRefHolder()

    // const questionAnswer = "C"
    // const questionTitle = "What do you think of my Hashnode Quiz widget?"
    // const questionOptions = [
    //   "Who cares by the way? It's not my thing for the most part.",
    //   "It makes tiny sense",
    //   "~~Did you use `webpack` when creating it?",
    //   "Whatever"
    // ]
    // const questionFeedBack =
    //   "~~I've never for any reason loved to use `webpack`"

    // const questionRefHolder = createInstanceRefHolder()
    const controlPanelRefHolder = createInstanceRefHolder()
    const resultRefHolder = createInstanceRefHolder()

    //     const codeBoardCodeContent = `
    // #include <iostream>
    // #include <vector>
    // #include <algorithm>
    // #include <cmath>

    // using namespace std;

    // const int MAXN = 15;
    // int n;
    // double dist[MAXN][MAXN];
    // vector<int> path;

    // double tsp(int curr, int mask) {
    //   if (mask == (1 << n) - 1) return dist[curr][0];
    //   double ans = 1e9;
    //   for (int i = 0; i < n; i++) {
    //     if (!(mask & (1 << i))) {
    //       ans = min(ans, dist[curr][i] + tsp(i, mask | (1 << i)));
    //     }
    //   }
    //   return ans;
    // }

    // int main() {
    //   cin >> n;
    //   for (int i = 0; i < n; i++) {
    //     for (int j = 0; j < n; j++) {
    //       cin >> dist[i][j];
    //     }
    //   }
    //   path.push_back(0);
    //   for (int i = 1; i < n; i++) {
    //     if (dist[0][i] < dist[0][path.back()]) {
    //       path.clear();
    //       path.push_back(i);
    //     } else if (dist[0][i] == dist[0][path.back()]) {
    //       path.push_back(i);
    //     }
    //   }
    //   int mask = 1 << path[0];
    //   for (int i = 0; i < n; i++) {
    //     if (i != path[0]) {
    //       mask |= 1 << i;
    //     }
    //   }
    //   for (int i = 1; i < path.size(); i++) {
    //     vector<int> prev_path = path;
    //     vector<int> new_path;
    //     new_path.push_back(path[i]);
    //     for (int j = 0; j < prev_path.size(); j++) {
    //       if (prev_path[j] != path[i]) {
    //         new_path.push_back(prev_path[j]);
    //       }
    //     }
    //     double ans = dist[0][path[i]] + tsp(path[i], mask | (1 << path[i]));
    //     for (int j = 1; j < new_path.size(); j++) {
    //       ans += dist[new_path[j - 1]][new_path[j]];
    //       mask |= 1 << new_path[j];
    //     }
    //     if (ans < tsp(0, mask)) {
    //       path = new_path;
    //     }
    //   }
    //   cout << "Optimal tour:";
    //   for (int i = 0; i < path.size(); i++) {
    //     cout << " " << path[i];
    //   }
    //   cout << endl;
    //   cout << "Optimal cost: " << tsp(0, 1) << endl;
    //   return 0;
    // }
    // `

    setTimeout(() => resultRefHolder.ref.renderIndicator(), 0)

    return (
      <section className={Styles.Quiz} aria-labelledby={quizLabellingId}>
        <Header labellingId={quizLabellingId}>{headerContent}</Header>
        <Progress levelsCount={5} refHolder={progressRefHolder} />
        {/* <Question
          answer={questionAnswer}
          feedBackContent={questionFeedBack}
          options={questionOptions}
          refHolder={questionRefHolder}
          title={questionTitle}
        /> */}
        {/* <CodeBoard
          content={codeBoardCodeContent}
          language="cpp"
          title="~~Whatever you want in the `code` below"
        /> */}
        {/* eslint-disable */}
        <Result
          answersGotten={3}
          handleExplanationsReview={() =>
            console.log(`Now reviewing random number: ${Math.random()}`)
          }
          questionsCount={12}
          refHolder={resultRefHolder}
        />
        <ControlPanel
          handlePrevButtonClick={() => console.log("Clicking Prev")}
          handleNextButtonClick={() => console.log("Clicking Next")}
          handleSubmitButtonClick={() => console.log("Clicking Submit")}
          refHolder={controlPanelRefHolder}
        />
        {/* eslint-enable */}
      </section>
    )
  }
}
