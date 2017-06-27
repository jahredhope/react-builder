import React from 'react';
import replacedComponentName from './replacedComponentName';
import { shallow } from 'enzyme';
import toJson from 'enzyme-to-json';

describe('replacedComponentName', () => {
  beforeEach(() => {});
  it('renders correctly', () => {
    const wrapper = shallow(
      <replacedComponentName />
    );
    expect(toJson(wrapper)).toMatchSnapshot();
  });
});
