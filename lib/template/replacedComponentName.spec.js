import React from 'react';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

import replacedComponentName from './replacedComponentName';

describe('replacedComponentName', () => {
  beforeEach(() => {});
  it('renders correctly', () => {
    const wrapper = shallow(
      <replacedComponentName />
    );
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
