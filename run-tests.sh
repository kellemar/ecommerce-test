#!/bin/bash

echo "Running API tests..."
cd api && npm test
if [ $? -ne 0 ]; then
  echo "API tests failed!"
  exit 1
fi

echo "Running Web tests..."
cd ../web && npm run test:run
if [ $? -ne 0 ]; then
  echo "Web tests failed!"
  exit 1
fi

echo "All tests passed!"
cd ..
