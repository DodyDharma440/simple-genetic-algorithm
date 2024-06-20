import "@mantine/core/styles.css";

import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  MantineProvider,
  NumberInput,
  Table,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useCallback, useEffect, useState } from "react";

interface IPopulation {
  score: number;
  text: string;
}

const makeId = (length: number) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$= _-.();,";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const charDiff = (s1: string, s2: string) => {
  let cost = 0;
  for (let i = 0; i <= s1.length; i++) {
    if (s1[i] != s2[i]) {
      cost++;
    }
  }
  return cost;
};

const getRandomInt = (max: number) => {
  return Math.floor(Math.random() * max);
};

type CombineMode = "score" | "prune" | "breed" | null;

function App() {
  const [combineMode, setCombineMode] = useState<CombineMode>(null);

  const [targetStr, setTargetStr] = useState("contoh");
  const [population, setPopulation] = useState<IPopulation[][]>([]);
  const [populationSize, setPopulationSize] = useState(500);
  const [mutationFactor, setMutationFactor] = useState(0.02);
  const [keep, setKeep] = useState(10);

  const [currentGen, setCurrentGen] = useState(0);

  const randomCitizen = useCallback(() => {
    return {
      score: 0,
      text: makeId(targetStr.length),
    };
  }, [targetStr.length]);

  const randomCitizenFromKeepers = useCallback(
    (gen: number) => {
      let newString = "";
      const sources = [];
      for (let i = 0; i < targetStr.length; i++) {
        const source = getRandomInt(keep);
        let character = population?.[gen - 1]?.[source]?.text?.substring(
          i,
          i + 1
        );
        if (Math.random() < mutationFactor) {
          character = makeId(1);
        }
        sources.push(source);
        newString = newString + character;
      }
      return {
        score: 0,
        text: newString,
      };
    },
    [keep, mutationFactor, population, targetStr.length]
  );

  const handleGenerate = useCallback(() => {
    const initialPopulation: IPopulation[][] = [];
    initialPopulation[0] = [];
    for (let i = 0; i < populationSize; i++) {
      initialPopulation[0].push(randomCitizen());
    }
    setCurrentGen(0);
    setPopulation(initialPopulation);
  }, [populationSize, randomCitizen]);

  const scoreAtPopulationItem = useCallback(
    (text: string) => {
      let longer = targetStr;
      let shorter = text;
      if (targetStr.length < text.length) {
        longer = text;
        shorter = targetStr;
      }
      const longerLength = longer.length;
      if (longerLength == 0) {
        return 1.0;
      }
      const score =
        (longerLength - charDiff(longer, shorter)) /
        parseFloat(`${longerLength}`);
      return Number(score.toFixed(2));
    },
    [targetStr]
  );

  const scoreHandler = useCallback(
    (population: IPopulation[][]) => {
      return population.map((item, index) => {
        if (index === currentGen) {
          return population[currentGen]
            .map((item) => {
              return {
                ...item,
                score: scoreAtPopulationItem(item.text),
              };
            })
            .sort((a, b) => {
              return b.score - a.score;
            });
        }
        return item;
      });
    },
    [currentGen, scoreAtPopulationItem]
  );

  const pruneHandler = useCallback(
    (population: IPopulation[][]) => {
      return population.map((items, index) => {
        if (index === currentGen) {
          return items.slice(0, keep);
        }
        return items;
      });
    },
    [currentGen, keep]
  );

  const handleScore = useCallback(() => {
    setPopulation(scoreHandler);
  }, [scoreHandler]);

  const handlePrune = useCallback(() => {
    setPopulation(pruneHandler);
  }, [pruneHandler]);

  const handleBreed = useCallback(() => {
    setCurrentGen((prevGen) => {
      const initialPopulation: IPopulation[] = [];
      for (let i = 0; i < populationSize; i++) {
        initialPopulation.push(randomCitizenFromKeepers(prevGen + 1));
      }

      setPopulation((prevPop) => {
        prevPop[prevGen + 1] = initialPopulation;
        return prevPop;
      });
      return prevGen + 1;
    });
  }, [populationSize, randomCitizenFromKeepers]);

  const handleCombine = useCallback(() => {
    setCombineMode("score");
  }, []);

  const handleReset = useCallback(() => {
    setCurrentGen(0);
    setPopulation([]);
  }, []);

  const [autoRunMode, setAutoRunMode] = useState(false);
  const firstItemLastGen = population.slice().reverse()?.[0]?.[0].text;

  useEffect(() => {
    if (autoRunMode) {
      console.log("🚀 ~ useEffect ~ firstItemLastGen:", firstItemLastGen);
      if (firstItemLastGen !== targetStr) {
        handleCombine();
      } else {
        setAutoRunMode(false);
      }
    }
  }, [autoRunMode, firstItemLastGen, handleCombine, population, targetStr]);

  useEffect(() => {
    if (combineMode) {
      switch (combineMode) {
        case "score":
          handleScore();
          setCombineMode("prune");
          break;
        case "prune":
          handlePrune();
          setCombineMode("breed");
          break;
        case "breed":
          handleBreed();
          setCombineMode(null);
          break;
      }
    }
  }, [combineMode, handleBreed, handlePrune, handleScore]);

  return (
    <MantineProvider>
      <Container py="lg">
        <Card withBorder radius="md">
          <Title order={5}>Genetic Algorithm</Title>
        </Card>

        <Box py="md">
          <Card withBorder radius="md" p="md" mb="md">
            <Text fw="700">Pengaturan</Text>
            <Divider my="sm" />

            <Grid columns={12} gutter="md" mb="md">
              <Grid.Col span={6}>
                <TextInput
                  label="Target String"
                  placeholder="Target"
                  value={targetStr}
                  onChange={(e) => setTargetStr(e.target.value)}
                  disabled={Boolean(population.length)}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  min={0}
                  label="Jumlah teratas diambil"
                  placeholder="Masukkan jumlah"
                  value={keep}
                  onChange={(val) => setKeep(Number(val))}
                  disabled={Boolean(population.length)}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  min={0}
                  value={populationSize}
                  onChange={(val) => setPopulationSize(Number(val))}
                  label="Jumlah populasi"
                  placeholder="Masukkan jumlah"
                  disabled={Boolean(population.length)}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  min={0}
                  max={1}
                  value={mutationFactor}
                  onChange={(val) => setMutationFactor(Number(val))}
                  label="Faktor mutasi"
                  placeholder="Masukkan jumlah"
                  disabled={Boolean(population.length)}
                />
              </Grid.Col>
            </Grid>
            {!population.length ? (
              <Button onClick={handleGenerate}>Generate Populasi</Button>
            ) : (
              <Button onClick={handleReset}>Reset</Button>
            )}
          </Card>

          {population[0]?.length ? (
            <Card withBorder radius="md" p="md" mb="md">
              <Text fw="700">Aksi</Text>
              <Divider my="sm" />
              <Grid columns={12} gutter="md">
                <Grid.Col span={4}>
                  <Button w="100%" color="red" onClick={handleScore}>
                    Tentukan skor
                  </Button>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Button w="100%" color="yellow" onClick={handlePrune}>
                    Ambil {keep} item teratas
                  </Button>
                </Grid.Col>
                <Grid.Col span={4}>
                  <Button w="100%" color="green" onClick={handleBreed}>
                    Buat generasi baru
                  </Button>
                </Grid.Col>

                <Grid.Col span={6}>
                  <Button w="100%" onClick={handleCombine}>
                    Run
                  </Button>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Button
                    w="100%"
                    color="cyan"
                    onClick={() => setAutoRunMode(true)}
                  >
                    Auto Run
                  </Button>
                </Grid.Col>
              </Grid>
            </Card>
          ) : null}

          <Box style={{ overflow: "auto", whiteSpace: "nowrap" }}>
            {population
              .slice()
              .reverse()
              .map((items, index) => {
                return (
                  <Box
                    key={index}
                    style={{
                      width: "500px",
                      display: "inline-block",
                      height: "500px",
                    }}
                  >
                    <Text ta="center" fw="600" py="md">
                      Generation {population.length - index}
                    </Text>
                    <Box style={{ maxHeight: "450px" }}>
                      <Table>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Skor</Table.Th>
                            <Table.Th>String</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {items.map((pop, index) => {
                            return (
                              <Table.Tr key={index}>
                                <Table.Td>{pop.score}</Table.Td>
                                <Table.Td>{pop.text}</Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    </Box>
                  </Box>
                );
              })}
          </Box>
        </Box>
      </Container>
    </MantineProvider>
  );
}

export default App;
